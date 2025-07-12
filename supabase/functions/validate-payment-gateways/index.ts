import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    )

    // Get business settings
    const { data: settings, error: settingsError } = await supabase
      .from('business_settings')
      .select('*')
      .maybeSingle();

    if (settingsError) {
      throw new Error(`Settings error: ${settingsError.message}`);
    }

    if (!settings) {
      throw new Error('No business settings found');
    }

    // Check gateway configurations
    const gateways = {
      razorpay: {
        enabled: settings.razorpay_enabled,
        configured: false,
        hasPublicKey: !!settings.razorpay_key_id?.trim(),
        hasSecretKey: !!Deno.env.get('RAZORPAY_SECRET_KEY'),
        status: 'not_configured'
      },
      ekqr: {
        enabled: settings.ekqr_enabled,
        configured: false,
        hasMerchantCode: !!settings.ekqr_merchant_code?.trim(),
        hasApiKey: !!Deno.env.get('EKQR_API_KEY'),
        status: 'not_configured'
      },
      offline: {
        enabled: settings.offline_enabled,
        configured: settings.offline_enabled,
        status: settings.offline_enabled ? 'configured' : 'not_configured'
      }
    };

    // Validate Razorpay configuration
    if (gateways.razorpay.hasPublicKey && gateways.razorpay.hasSecretKey) {
      gateways.razorpay.configured = true;
      gateways.razorpay.status = gateways.razorpay.enabled ? 'configured' : 'disabled';
    } else {
      gateways.razorpay.status = !gateways.razorpay.hasPublicKey ? 'missing_public_key' : 'missing_secret_key';
    }

    // Validate EKQR configuration  
    if (gateways.ekqr.hasMerchantCode && gateways.ekqr.hasApiKey) {
      gateways.ekqr.configured = true;
      gateways.ekqr.status = gateways.ekqr.enabled ? 'configured' : 'disabled';
    } else {
      gateways.ekqr.status = !gateways.ekqr.hasMerchantCode ? 'missing_merchant_code' : 'missing_api_key';
    }

    // Get available payment methods (only fully configured and enabled ones)
    const availableMethods = [];
    if (gateways.razorpay.enabled && gateways.razorpay.configured) {
      availableMethods.push('razorpay');
    }
    if (gateways.ekqr.enabled && gateways.ekqr.configured) {
      availableMethods.push('ekqr');
    }
    if (gateways.offline.enabled) {
      availableMethods.push('offline');
    }


    return new Response(
      JSON.stringify({ 
        success: true,
        gateways,
        availableMethods,
        totalConfigured: availableMethods.length
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    console.error('Gateway validation error:', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message,
        gateways: {},
        availableMethods: [],
        totalConfigured: 0
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});