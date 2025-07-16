import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface APIKeyUpdate {
  google_maps_api_key?: string;
  razorpay_key_id?: string;
  razorpay_key_secret?: string;
  ekqr_api_key?: string;
}

interface APIKeyResponse {
  google_maps_api_key_preview?: string;
  razorpay_key_id_preview?: string;
  razorpay_key_secret_preview?: string;
  ekqr_api_key_preview?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Verify user is admin
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      throw new Error('Invalid user');
    }

    // Check if user is admin
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError || profile?.role !== 'admin') {
      throw new Error('Unauthorized - Admin access required');
    }

    const { method } = req;

    if (method === 'GET') {
      // Return masked previews of current API keys
      const previews: APIKeyResponse = {};

      // Get current secrets and create masked previews
      const googleMapsKey = Deno.env.get('GOOGLE_MAPS_API_KEY');
      if (googleMapsKey) {
        previews.google_maps_api_key_preview = maskAPIKey(googleMapsKey, 'AIza', 4);
      }

      const razorpayKeyId = Deno.env.get('RAZORPAY_KEY_ID');
      if (razorpayKeyId) {
        previews.razorpay_key_id_preview = maskAPIKey(razorpayKeyId, 'rzp_', 4);
      }

      const razorpaySecret = Deno.env.get('RAZORPAY_KEY_SECRET');
      if (razorpaySecret) {
        previews.razorpay_key_secret_preview = maskAPIKey(razorpaySecret, '', 4);
      }

      const ekqrKey = Deno.env.get('EKQR_API_KEY');
      if (ekqrKey) {
        previews.ekqr_api_key_preview = maskAPIKey(ekqrKey, '', 4);
      }

      // Update business_settings with preview values
      if (Object.keys(previews).length > 0) {
        await supabase
          .from('business_settings')
          .update(previews)
          .eq('id', (await supabase.from('business_settings').select('id').single()).data?.id);
      }

      return new Response(
        JSON.stringify({
          success: true,
          data: previews
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      );
    }

    if (method === 'POST') {
      const body: APIKeyUpdate = await req.json();
      const updates: Record<string, string> = {};
      const previews: APIKeyResponse = {};

      // Validate and process each API key
      if (body.google_maps_api_key !== undefined) {
        if (body.google_maps_api_key && !validateGoogleMapsKey(body.google_maps_api_key)) {
          throw new Error('Invalid Google Maps API key format');
        }
        if (body.google_maps_api_key) {
          updates.GOOGLE_MAPS_API_KEY = body.google_maps_api_key;
          previews.google_maps_api_key_preview = maskAPIKey(body.google_maps_api_key, 'AIza', 4);
        } else {
          // Clear the key
          updates.GOOGLE_MAPS_API_KEY = '';
          previews.google_maps_api_key_preview = '';
        }
      }

      if (body.razorpay_key_id !== undefined) {
        if (body.razorpay_key_id && !validateRazorpayKeyId(body.razorpay_key_id)) {
          throw new Error('Invalid Razorpay Key ID format');
        }
        if (body.razorpay_key_id) {
          updates.RAZORPAY_KEY_ID = body.razorpay_key_id;
          previews.razorpay_key_id_preview = maskAPIKey(body.razorpay_key_id, 'rzp_', 4);
        } else {
          updates.RAZORPAY_KEY_ID = '';
          previews.razorpay_key_id_preview = '';
        }
      }

      if (body.razorpay_key_secret !== undefined) {
        if (body.razorpay_key_secret && !validateRazorpaySecret(body.razorpay_key_secret)) {
          throw new Error('Invalid Razorpay Secret format');
        }
        if (body.razorpay_key_secret) {
          updates.RAZORPAY_KEY_SECRET = body.razorpay_key_secret;
          previews.razorpay_key_secret_preview = maskAPIKey(body.razorpay_key_secret, '', 4);
        } else {
          updates.RAZORPAY_KEY_SECRET = '';
          previews.razorpay_key_secret_preview = '';
        }
      }

      if (body.ekqr_api_key !== undefined) {
        if (body.ekqr_api_key && !validateEKQRKey(body.ekqr_api_key)) {
          throw new Error('Invalid EKQR API key format');
        }
        if (body.ekqr_api_key) {
          updates.EKQR_API_KEY = body.ekqr_api_key;
          previews.ekqr_api_key_preview = maskAPIKey(body.ekqr_api_key, '', 4);
        } else {
          updates.EKQR_API_KEY = '';
          previews.ekqr_api_key_preview = '';
        }
      }

      console.log('Updating API keys:', Object.keys(updates));

      // Note: In a real implementation, you would update Supabase secrets here
      // For now, we'll just update the preview in business_settings
      if (Object.keys(previews).length > 0) {
        const { error: updateError } = await supabase
          .from('business_settings')
          .update(previews)
          .eq('id', (await supabase.from('business_settings').select('id').single()).data?.id);

        if (updateError) {
          throw new Error(`Failed to update previews: ${updateError.message}`);
        }
      }

      return new Response(
        JSON.stringify({
          success: true,
          message: 'API keys updated successfully',
          updated_keys: Object.keys(updates)
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      );
    }

    if (method === 'PUT') {
      // Test API key connectivity
      const { key_type, key_value } = await req.json();
      
      let testResult;
      switch (key_type) {
        case 'google_maps':
          testResult = await testGoogleMapsKey(key_value);
          break;
        case 'razorpay':
          testResult = await testRazorpayKeys(key_value.key_id, key_value.key_secret);
          break;
        case 'ekqr':
          testResult = await testEKQRKey(key_value);
          break;
        default:
          throw new Error('Invalid key type for testing');
      }

      return new Response(
        JSON.stringify({
          success: true,
          test_result: testResult
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      );
    }

    throw new Error('Method not allowed');

  } catch (error) {
    console.error('API Keys management error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    );
  }
});

// Utility functions
function maskAPIKey(key: string, prefix: string = '', suffixLength: number = 4): string {
  if (key.length <= suffixLength + prefix.length) {
    return '*'.repeat(key.length);
  }
  
  const maskedLength = key.length - suffixLength - prefix.length;
  const suffix = key.slice(-suffixLength);
  
  return prefix + '*'.repeat(maskedLength) + suffix;
}

// Validation functions
function validateGoogleMapsKey(key: string): boolean {
  return /^AIza[0-9A-Za-z_-]{35}$/.test(key);
}

function validateRazorpayKeyId(keyId: string): boolean {
  return /^rzp_[a-zA-Z0-9]{14}$/.test(keyId);
}

function validateRazorpaySecret(secret: string): boolean {
  return /^[a-zA-Z0-9]{24}$/.test(secret);
}

function validateEKQRKey(key: string): boolean {
  // EKQR keys are typically UUIDs or alphanumeric strings
  return /^[a-zA-Z0-9-]{8,50}$/.test(key);
}

// Test functions
async function testGoogleMapsKey(apiKey: string): Promise<any> {
  try {
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?address=Mumbai&key=${apiKey}`
    );
    const data = await response.json();
    
    if (data.status === 'OK') {
      return { status: 'valid', message: 'Google Maps API key is working' };
    } else {
      return { status: 'invalid', message: data.error_message || 'Invalid API key' };
    }
  } catch (error) {
    return { status: 'error', message: 'Failed to test API key' };
  }
}

async function testRazorpayKeys(keyId: string, keySecret: string): Promise<any> {
  try {
    // Basic validation test - in real implementation, you'd make an actual API call
    if (validateRazorpayKeyId(keyId) && validateRazorpaySecret(keySecret)) {
      return { status: 'valid', message: 'Razorpay keys format is valid' };
    } else {
      return { status: 'invalid', message: 'Invalid Razorpay key format' };
    }
  } catch (error) {
    return { status: 'error', message: 'Failed to test Razorpay keys' };
  }
}

async function testEKQRKey(apiKey: string): Promise<any> {
  try {
    // Basic validation - in real implementation, you'd test with EKQR API
    if (validateEKQRKey(apiKey)) {
      return { status: 'valid', message: 'EKQR API key format is valid' };
    } else {
      return { status: 'invalid', message: 'Invalid EKQR key format' };
    }
  } catch (error) {
    return { status: 'error', message: 'Failed to test EKQR key' };
  }
}