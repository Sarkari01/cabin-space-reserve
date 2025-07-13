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
        ekqr_api_key_length: ekqrApiKey ? ekqrApiKey.length : 0,
        function_name: 'ekqr-payment',
        available_actions: ['createQR', 'checkStatus']
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

  // Use official EKQR API endpoint and format
  const orderId = `BOOKING_${bookingId}_${Date.now()}`;
  const requestBody = {
    amount: Math.round(amount),
    purpose: `Study Hall Booking ${bookingId}`,
    order_id: orderId
  };
  
  // Official EKQR API endpoint from documentation
  const apiUrl = 'https://ekqr.co/api/ekqr';
  
  console.log('🌐 [EKQR-PAYMENT] Making API request to official endpoint');
  console.log('📍 [EKQR-PAYMENT] Request URL:', apiUrl);
  console.log('📤 [EKQR-PAYMENT] Request body:', JSON.stringify(requestBody, null, 2));
  console.log('🔐 [EKQR-PAYMENT] API key preview:', `${ekqrApiKey.substring(0, 8)}...`);
  
  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ekqrApiKey, // Use official auth header
        'Accept': 'application/json'
      },
      body: JSON.stringify(requestBody),
    });

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
        qr_id: data.id || data.reference_id,
        qr_image_url: data.qr_url || data.qr_code,
        reference_id: orderId,
        amount: data.amount || amount
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('[EKQR-PAYMENT] Network or processing error:', error);
    throw new Error(`EKQR API call failed: ${error.message}`);
  }
}

async function checkPaymentStatus(qrId: string, ekqrApiKey: string) {
  console.log('🔍 [EKQR-PAYMENT] Checking payment status for QR ID:', qrId);

  // Official EKQR status check endpoint
  const statusUrl = `https://ekqr.co/api/ekqr/status/${qrId}`;
  
  console.log('🔍 [EKQR-PAYMENT] Making status check API request');
  console.log('📍 [EKQR-PAYMENT] Status URL:', statusUrl);
  console.log('🔐 [EKQR-PAYMENT] API key preview:', `${ekqrApiKey.substring(0, 8)}...`);
  
  try {
    const response = await fetch(statusUrl, {
      method: 'GET',
      headers: {
        'x-api-key': ekqrApiKey, // Use official auth header
        'Accept': 'application/json'
      },
    });

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
        qr_id: data.id || qrId,
        reference_id: data.order_id || data.reference_id,
        amount: data.amount,
        transaction_id: data.reference_id || data.id
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('[EKQR-PAYMENT] Status check error:', error);
    throw new Error(`EKQR status check failed: ${error.message}`);
  }
}