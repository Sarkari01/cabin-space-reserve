import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

Deno.serve(async (req) => {
  console.log('🚀 EKQR Payment function called - method:', req.method, 'url:', req.url);
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log('✅ EKQR: Handling OPTIONS request');
    return new Response(null, { headers: corsHeaders });
  }

  // Health check endpoint
  const url = new URL(req.url);
  if (url.pathname.includes('/health')) {
    console.log('💚 EKQR: Health check requested');
    const ekqrApiKey = Deno.env.get('EKQR_API_KEY');
    return new Response(
      JSON.stringify({ 
        status: 'healthy', 
        timestamp: new Date().toISOString(),
        ekqr_api_key_configured: !!ekqrApiKey,
        ekqr_api_key_length: ekqrApiKey ? ekqrApiKey.length : 0
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    console.log('🔧 EKQR: Initializing Supabase client');
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    )

    console.log('📖 EKQR: Parsing request body');
    const requestBody = await req.json();
    console.log('📦 EKQR: Received request:', JSON.stringify(requestBody, null, 2));
    const { action, transactionId, amount, bookingId } = requestBody;

    // Validate API key upfront
    const ekqrApiKey = Deno.env.get('EKQR_API_KEY');
    if (!ekqrApiKey) {
      console.error('❌ EKQR_API_KEY not found in environment variables');
      return new Response(
        JSON.stringify({ 
          error: 'EKQR payment service is not configured. Please contact support.',
          code: 'MISSING_API_KEY'
        }),
        { 
          status: 503,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log(`🔑 EKQR: API key found (length: ${ekqrApiKey.length}, preview: ${ekqrApiKey.substring(0, 8)}...)`);

    switch (action) {
      case 'createQR':
        if (!amount || !bookingId) {
          throw new Error('Missing required parameters: amount and bookingId');
        }
        return await createQRCode(amount, bookingId, ekqrApiKey);
      case 'checkStatus':
        if (!transactionId) {
          throw new Error('Missing required parameter: transactionId');
        }
        return await checkPaymentStatus(transactionId, ekqrApiKey);
      default:
        throw new Error(`Invalid action: ${action}. Supported actions: createQR, checkStatus`);
    }
  } catch (error) {
    console.error('💥 EKQR Payment Error:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        code: 'FUNCTION_ERROR',
        timestamp: new Date().toISOString()
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

async function createQRCode(amount: number, bookingId: string, ekqrApiKey: string) {
  console.log('💳 [EKQR-PAYMENT] Creating QR code for booking:', bookingId, 'Amount: ₹', amount);

  // Validate amount
  if (!amount || amount <= 0) {
    throw new Error(`Invalid amount: ${amount}. Amount must be greater than 0.`);
  }

  // EKQR API call - Using test endpoint first to verify connectivity
  const requestBody = {
    amount: Math.round(amount), // Ensure whole number
    purpose: 'Study Hall Booking',
    order_id: `BOOKING_${bookingId.substring(0, 15)}_${Date.now()}`,
    callback_url: `${Deno.env.get('SUPABASE_URL')}/functions/v1/ekqr-payment/callback`
  };
  
  // Try alternative EKQR API endpoints (common variations)
  const possibleUrls = [
    'https://api.ekqr.in/api/v1/qr/create',
    'https://ekqr.in/api/qr/create', 
    'https://api.ekqr.co/v1/qr/create',
    'https://ekqr.co/api/qr/create'
  ];
  
  const apiUrl = possibleUrls[0]; // Start with most likely correct endpoint
  
  console.log('🌐 [EKQR-PAYMENT] Making API request');
  console.log('📍 [EKQR-PAYMENT] Request URL:', apiUrl);
  console.log('📤 [EKQR-PAYMENT] Request body:', JSON.stringify(requestBody, null, 2));
  console.log('🔐 [EKQR-PAYMENT] API key preview:', `${ekqrApiKey.substring(0, 8)}...`);
  
  let response;
  let lastError;
  
  // Try different API endpoints and auth methods
  for (const url of possibleUrls) {
    try {
      console.log(`🔄 Trying EKQR API endpoint: ${url}`);
      response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${ekqrApiKey}`,
          'Accept': 'application/json',
          'User-Agent': 'StudyHall-Payment/1.0'
        },
        body: JSON.stringify(requestBody),
      });
      
      if (response.ok) {
        console.log(`✅ Success with endpoint: ${url}`);
        break;
      } else {
        console.log(`❌ Failed with endpoint: ${url}, status: ${response.status}`);
        lastError = `${url} returned ${response.status}`;
      }
    } catch (error) {
      console.log(`❌ Network error with endpoint: ${url}`, error.message);
      lastError = `${url} network error: ${error.message}`;
      continue;
    }
  }
  
  if (!response || !response.ok) {
    throw new Error(`All EKQR endpoints failed. Last error: ${lastError}`);
  }

  console.log('[EKQR-PAYMENT] API response status:', response.status);
  console.log('[EKQR-PAYMENT] Response headers:', Object.fromEntries(response.headers.entries()));

  const responseText = await response.text();
  console.log('[EKQR-PAYMENT] Raw API response:', responseText);

  if (!response.ok) {
    console.error('[EKQR-PAYMENT] API Error - Status:', response.status);
    console.error('[EKQR-PAYMENT] API Error - Response:', responseText);
    
    // Provide more specific error messages based on status codes
    if (response.status === 401) {
      throw new Error(`Invalid EKQR API key. Status: ${response.status}, Response: ${responseText}`);
    } else if (response.status === 400) {
      throw new Error(`Invalid payment request. Status: ${response.status}, Response: ${responseText}`);
    } else if (response.status >= 500) {
      throw new Error(`EKQR service error. Status: ${response.status}, Response: ${responseText}`);
    }
    
    throw new Error(`Failed to create QR code. Status: ${response.status}, Response: ${responseText}`);
  }

  let data;
  try {
    data = JSON.parse(responseText);
    console.log('[EKQR-PAYMENT] Parsed response data:', data);
  } catch (parseError) {
    console.error('[EKQR-PAYMENT] Failed to parse response as JSON:', parseError);
    throw new Error(`Invalid API response format: ${responseText}`);
  }
  
  return new Response(
    JSON.stringify({ 
      success: true, 
      qr_id: data.id,
      qr_image_url: data.qr_url,
      reference_id: data.order_id,
      amount: data.amount
    }),
    { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    }
  );
}

async function checkPaymentStatus(qrId: string, ekqrApiKey: string) {
  console.log('🔍 [EKQR-PAYMENT] Checking payment status for QR ID:', qrId);

  // Check EKQR payment status - Try multiple endpoints
  const possibleStatusUrls = [
    `https://api.ekqr.in/api/v1/qr/status/${qrId}`,
    `https://ekqr.in/api/qr/status/${qrId}`,
    `https://api.ekqr.co/v1/qr/status/${qrId}`,
    `https://ekqr.co/api/qr/status/${qrId}`
  ];
  
  console.log('🔍 [EKQR-PAYMENT] Making status check API request');
  console.log('🔐 [EKQR-PAYMENT] API key preview:', `${ekqrApiKey.substring(0, 8)}...`);
  
  let response;
  let lastError;
  
  // Try different status endpoints
  for (const statusUrl of possibleStatusUrls) {
    try {
      console.log(`🔄 Trying status endpoint: ${statusUrl}`);
      response = await fetch(statusUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${ekqrApiKey}`,
          'Accept': 'application/json',
          'User-Agent': 'StudyHall-Payment/1.0'
        },
      });
      
      if (response.ok) {
        console.log(`✅ Status check success with: ${statusUrl}`);
        break;
      } else {
        console.log(`❌ Status check failed with: ${statusUrl}, status: ${response.status}`);
        lastError = `${statusUrl} returned ${response.status}`;
      }
    } catch (error) {
      console.log(`❌ Status check network error with: ${statusUrl}`, error.message);
      lastError = `${statusUrl} network error: ${error.message}`;
      continue;
    }
  }
  
  if (!response || !response.ok) {
    throw new Error(`All EKQR status endpoints failed. Last error: ${lastError}`);
  }

  console.log('[EKQR-PAYMENT] Status check response status:', response.status);
  console.log('[EKQR-PAYMENT] Status check response headers:', Object.fromEntries(response.headers.entries()));

  const responseText = await response.text();
  console.log('[EKQR-PAYMENT] Status check raw response:', responseText);

  if (!response.ok) {
    console.error('[EKQR-PAYMENT] Status Check Error - Status:', response.status);
    console.error('[EKQR-PAYMENT] Status Check Error - Response:', responseText);
    
    if (response.status === 401) {
      throw new Error(`Invalid EKQR API key for status check. Status: ${response.status}, Response: ${responseText}`);
    } else if (response.status === 404) {
      throw new Error(`Payment transaction not found. Status: ${response.status}, Response: ${responseText}`);
    }
    
    throw new Error(`Failed to check payment status. Status: ${response.status}, Response: ${responseText}`);
  }

  let data;
  try {
    data = JSON.parse(responseText);
    console.log('[EKQR-PAYMENT] Status check parsed data:', data);
  } catch (parseError) {
    console.error('[EKQR-PAYMENT] Failed to parse status response as JSON:', parseError);
    throw new Error(`Invalid status response format: ${responseText}`);
  }
  
  return new Response(
    JSON.stringify({ 
      success: true, 
      status: data.status, // 'pending', 'success', 'failed'
      qr_id: data.id,
      reference_id: data.order_id,
      amount: data.amount,
      transaction_id: data.reference_id
    }),
    { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    }
  );
}