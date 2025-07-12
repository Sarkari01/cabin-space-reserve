import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    // Get business settings
    const { data: settings, error } = await supabase
      .from('business_settings')
      .select('*')
      .single();

    if (error) {
      throw new Error(`Failed to fetch business settings: ${error.message}`);
    }

    const gateways: Record<string, string> = {};
    const availableMethods: string[] = [];

    // Validate EKQR - relaxed validation
    if (settings.ekqr_enabled) {
      const ekqrApiKey = Deno.env.get('EKQR_API_KEY');
      if (ekqrApiKey && ekqrApiKey.trim()) {
        // More flexible API key validation - check for UUID format but be case-insensitive
        const trimmedKey = ekqrApiKey.trim();
        const isValidApiKey = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(trimmedKey);
        
        console.log('[PAYMENT-GATEWAY] EKQR API Key validation:', {
          keyLength: trimmedKey.length,
          isValidFormat: isValidApiKey,
          keyPreview: `${trimmedKey.substring(0, 8)}...`
        });
        
        if (isValidApiKey) {
          gateways.ekqr = 'configured';
          availableMethods.push('ekqr');
        } else {
          console.error('[PAYMENT-GATEWAY] Invalid EKQR API key format:', trimmedKey);
          gateways.ekqr = 'invalid_credentials';
        }
      } else {
        console.error('[PAYMENT-GATEWAY] EKQR API key is missing or empty');
        gateways.ekqr = 'missing_config';
      }
    } else {
      gateways.ekqr = 'disabled';
    }

    // Validate Offline Payment
    if (settings.offline_enabled) {
      gateways.offline = 'configured';
      availableMethods.push('offline');
    } else {
      gateways.offline = 'disabled';
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        gateways,
        availableMethods,
        settings: {
          ekqr_enabled: settings.ekqr_enabled,
          ekqr_api_key_configured: !!Deno.env.get('EKQR_API_KEY'),
          offline_enabled: settings.offline_enabled
        }
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    console.error('Error validating payment gateways:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});