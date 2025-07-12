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

    // Validate EKQR
    if (settings.ekqr_enabled) {
      if (settings.ekqr_api_key && settings.ekqr_api_key.trim()) {
        // Check if API key format is valid (should be a UUID-like string)
        const isValidApiKey = /^[a-f0-9-]{36}$/i.test(settings.ekqr_api_key.trim());
        
        if (isValidApiKey) {
          gateways.ekqr = 'configured';
          availableMethods.push('ekqr');
        } else {
          gateways.ekqr = 'invalid_credentials';
        }
      } else {
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
          ekqr_api_key: !!settings.ekqr_api_key,
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