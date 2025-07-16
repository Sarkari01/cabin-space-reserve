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
  gemini_api_key?: string;
}

interface APIKeyResponse {
  google_maps_api_key_preview?: string;
  razorpay_key_id_preview?: string;
  razorpay_key_secret_preview?: string;
  ekqr_api_key_preview?: string;
  gemini_api_key_preview?: string;
}

interface RequestBody {
  operation: 'get' | 'save' | 'test';
  data?: APIKeyUpdate;
  test_config?: {
    key_type: string;
    key_value: any;
  };
}

// Get secret from Supabase Management API
async function getSupabaseSecret(secretName: string): Promise<string | null> {
  try {
    const projectId = Deno.env.get('SUPABASE_PROJECT_REF') || 'jseyxxsptcckjumjcljk';
    const managementUrl = `https://api.supabase.com/v1/projects/${projectId}/secrets`;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!serviceRoleKey) {
      console.error('SUPABASE_SERVICE_ROLE_KEY not found');
      return null;
    }

    const response = await fetch(managementUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${serviceRoleKey}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      console.error(`Failed to fetch secrets: ${response.status} ${response.statusText}`);
      return null;
    }

    const secrets = await response.json();
    const secret = secrets.find((s: any) => s.name === secretName);
    return secret?.value || null;
  } catch (error) {
    console.error(`Error getting secret ${secretName}:`, error);
    return null;
  }
}

// Set secret in Supabase Management API
async function setSupabaseSecret(secretName: string, secretValue: string): Promise<boolean> {
  try {
    const projectId = Deno.env.get('SUPABASE_PROJECT_REF') || 'jseyxxsptcckjumjcljk';
    const managementUrl = `https://api.supabase.com/v1/projects/${projectId}/secrets`;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!serviceRoleKey) {
      console.error('SUPABASE_SERVICE_ROLE_KEY not found');
      return false;
    }

    const response = await fetch(managementUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${serviceRoleKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify([{
        name: secretName,
        value: secretValue
      }])
    });

    if (!response.ok) {
      console.error(`Failed to set secret ${secretName}: ${response.status} ${response.statusText}`);
      const errorText = await response.text();
      console.error('Error response:', errorText);
      return false;
    }

    console.log(`Successfully set secret: ${secretName}`);
    return true;
  } catch (error) {
    console.error(`Error setting secret ${secretName}:`, error);
    return false;
  }
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

    // Parse request body for operation type
    const requestBody: RequestBody = await req.json();
    const { operation } = requestBody;

    console.log('API Keys operation:', operation);

    if (operation === 'get') {
      // Return masked previews of current API keys
      const previews: APIKeyResponse = {};

      // Get current secrets from Supabase secrets management
      const googleMapsKey = await getSupabaseSecret('GOOGLE_MAPS_API_KEY');
      if (googleMapsKey) {
        previews.google_maps_api_key_preview = maskAPIKey(googleMapsKey, 'AIza', 4);
      }

      const razorpayKeyId = await getSupabaseSecret('RAZORPAY_KEY_ID');
      if (razorpayKeyId) {
        previews.razorpay_key_id_preview = maskAPIKey(razorpayKeyId, 'rzp_', 4);
      }

      const razorpaySecret = await getSupabaseSecret('RAZORPAY_KEY_SECRET');
      if (razorpaySecret) {
        previews.razorpay_key_secret_preview = maskAPIKey(razorpaySecret, '', 4);
      }

      const ekqrKey = await getSupabaseSecret('EKQR_API_KEY');
      if (ekqrKey) {
        previews.ekqr_api_key_preview = maskAPIKey(ekqrKey, '', 4);
      }

      const geminiKey = await getSupabaseSecret('GEMINI_API_KEY');
      if (geminiKey) {
        previews.gemini_api_key_preview = maskAPIKey(geminiKey, '', 4);
      }

      // Update business_settings with preview values
      if (Object.keys(previews).length > 0) {
        const { data: settingsData } = await supabase.from('business_settings').select('id').single();
        if (settingsData?.id) {
          await supabase
            .from('business_settings')
            .update(previews)
            .eq('id', settingsData.id);
        }
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

    if (operation === 'save') {
      const apiKeyData = requestBody.data;
      if (!apiKeyData) {
        throw new Error('No API key data provided');
      }

      const secretOperations: Promise<boolean>[] = [];
      const previews: APIKeyResponse = {};
      const updatedKeys: string[] = [];

      // Save each provided API key as a Supabase secret and create preview
      if (apiKeyData.google_maps_api_key !== undefined) {
        if (apiKeyData.google_maps_api_key && apiKeyData.google_maps_api_key.length < 10) {
          throw new Error('Google Maps API key is too short');
        }
        if (apiKeyData.google_maps_api_key) {
          secretOperations.push(setSupabaseSecret('GOOGLE_MAPS_API_KEY', apiKeyData.google_maps_api_key));
          previews.google_maps_api_key_preview = maskAPIKey(apiKeyData.google_maps_api_key, '', 4);
          updatedKeys.push('GOOGLE_MAPS_API_KEY');
        } else {
          // Empty string means delete the secret (not implemented in this version)
          previews.google_maps_api_key_preview = '';
        }
      }

      if (apiKeyData.razorpay_key_id !== undefined) {
        if (apiKeyData.razorpay_key_id && apiKeyData.razorpay_key_id.length < 10) {
          throw new Error('Razorpay Key ID is too short');
        }
        if (apiKeyData.razorpay_key_id) {
          secretOperations.push(setSupabaseSecret('RAZORPAY_KEY_ID', apiKeyData.razorpay_key_id));
          previews.razorpay_key_id_preview = maskAPIKey(apiKeyData.razorpay_key_id, '', 4);
          updatedKeys.push('RAZORPAY_KEY_ID');
        } else {
          previews.razorpay_key_id_preview = '';
        }
      }

      if (apiKeyData.razorpay_key_secret !== undefined) {
        if (apiKeyData.razorpay_key_secret && apiKeyData.razorpay_key_secret.length < 10) {
          throw new Error('Razorpay Secret is too short');
        }
        if (apiKeyData.razorpay_key_secret) {
          secretOperations.push(setSupabaseSecret('RAZORPAY_KEY_SECRET', apiKeyData.razorpay_key_secret));
          previews.razorpay_key_secret_preview = maskAPIKey(apiKeyData.razorpay_key_secret, '', 4);
          updatedKeys.push('RAZORPAY_KEY_SECRET');
        } else {
          previews.razorpay_key_secret_preview = '';
        }
      }

      if (apiKeyData.ekqr_api_key !== undefined) {
        if (apiKeyData.ekqr_api_key && apiKeyData.ekqr_api_key.length < 8) {
          throw new Error('EKQR API key is too short');
        }
        if (apiKeyData.ekqr_api_key) {
          secretOperations.push(setSupabaseSecret('EKQR_API_KEY', apiKeyData.ekqr_api_key));
          previews.ekqr_api_key_preview = maskAPIKey(apiKeyData.ekqr_api_key, '', 4);
          updatedKeys.push('EKQR_API_KEY');
        } else {
          previews.ekqr_api_key_preview = '';
        }
      }

      if (apiKeyData.gemini_api_key !== undefined) {
        if (apiKeyData.gemini_api_key && apiKeyData.gemini_api_key.length < 10) {
          throw new Error('Gemini API key is too short');
        }
        if (apiKeyData.gemini_api_key) {
          secretOperations.push(setSupabaseSecret('GEMINI_API_KEY', apiKeyData.gemini_api_key));
          previews.gemini_api_key_preview = maskAPIKey(apiKeyData.gemini_api_key, '', 4);
          updatedKeys.push('GEMINI_API_KEY');
        } else {
          previews.gemini_api_key_preview = '';
        }
      }

      console.log('Saving API keys as Supabase secrets:', updatedKeys);

      // Wait for all secret operations to complete
      if (secretOperations.length > 0) {
        const secretResults = await Promise.all(secretOperations);
        const failedOperations = secretResults.filter(result => !result);
        
        if (failedOperations.length > 0) {
          throw new Error(`Failed to save ${failedOperations.length} API key(s) as secrets. Check function logs for details.`);
        }
        
        console.log(`Successfully saved ${secretResults.length} API keys as Supabase secrets`);
      }

      // Update business_settings with preview values
      if (Object.keys(previews).length > 0) {
        const { data: settingsData } = await supabase.from('business_settings').select('id').single();
        if (settingsData?.id) {
          const { error: updateError } = await supabase
            .from('business_settings')
            .update(previews)
            .eq('id', settingsData.id);

          if (updateError) {
            throw new Error(`Failed to update previews: ${updateError.message}`);
          }
        }
      }

      return new Response(
        JSON.stringify({
          success: true,
          message: 'API keys saved successfully to Supabase secrets',
          updated_keys: updatedKeys
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      );
    }

    if (operation === 'test') {
      const testConfig = requestBody.test_config;
      if (!testConfig) {
        throw new Error('No test configuration provided');
      }

      const { key_type, key_value } = testConfig;
      
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
        case 'gemini':
          testResult = await testGeminiKey(key_value);
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

    throw new Error('Invalid operation. Supported operations: get, save, test');

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

async function testGeminiKey(apiKey: string): Promise<any> {
  try {
    const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models?key=' + apiKey);
    const data = await response.json();
    
    if (response.ok && data.models) {
      return { status: 'valid', message: 'Gemini API key is working' };
    } else {
      return { status: 'invalid', message: data.error?.message || 'Invalid Gemini API key' };
    }
  } catch (error) {
    return { status: 'error', message: 'Failed to test Gemini API key' };
  }
}