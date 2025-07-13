import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

interface CreateOrderRequest {
  amount: number;
  booking_id: string;
}

interface VerifyPaymentRequest {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
  transaction_id: string;
}

Deno.serve(async (req) => {
  console.log('🚀 Razorpay payment function invoked - method:', req.method, 'url:', req.url);
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log('✅ Razorpay: Handling OPTIONS request');
    return new Response(null, { headers: corsHeaders });
  }

  // Health check endpoint
  const url = new URL(req.url);
  if (url.pathname.includes('/health')) {
    console.log('💚 Razorpay: Health check requested');
    const keyId = Deno.env.get('RAZORPAY_KEY_ID');
    const keySecret = Deno.env.get('RAZORPAY_KEY_SECRET');
    return new Response(
      JSON.stringify({ 
        status: 'healthy', 
        timestamp: new Date().toISOString(),
        razorpay_key_id_configured: !!keyId,
        razorpay_key_secret_configured: !!keySecret,
        key_id_preview: keyId ? `${keyId.substring(0, 8)}...` : 'NOT SET'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    console.log('🔧 Razorpay: Initializing Supabase client');
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('📖 Razorpay: Parsing request body');
    const requestBody = await req.json();
    console.log('📦 Razorpay: Received request:', JSON.stringify(requestBody, null, 2));
    const { action, ...requestData } = requestBody;
    console.log('🎯 Razorpay: Action:', action);

    // Validate Razorpay credentials upfront
    const keyId = Deno.env.get('RAZORPAY_KEY_ID');
    const keySecret = Deno.env.get('RAZORPAY_KEY_SECRET');

    if (!keyId || !keySecret) {
      console.error('❌ Missing Razorpay credentials');
      return new Response(
        JSON.stringify({ 
          error: 'Razorpay payment service is not configured. Please contact support.',
          code: 'MISSING_CREDENTIALS',
          missing: {
            key_id: !keyId,
            key_secret: !keySecret
          }
        }),
        { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`🔑 Razorpay: Credentials found (Key ID: ${keyId.substring(0, 8)}..., Secret: ${keySecret.substring(0, 8)}...)`);

    if (action === 'create_order') {
      if (!requestData.amount || !requestData.booking_id) {
        throw new Error('Missing required parameters: amount and booking_id');
      }
      return await createRazorpayOrder(requestData as CreateOrderRequest, keyId, keySecret);
    } else if (action === 'verify_payment') {
      const verifyData = requestData as VerifyPaymentRequest;
      if (!verifyData.razorpay_payment_id || !verifyData.razorpay_order_id || !verifyData.razorpay_signature || !verifyData.transaction_id) {
        throw new Error('Missing required parameters for payment verification');
      }
      return await verifyRazorpayPayment(verifyData, supabase, keySecret);
    } else {
      return new Response(
        JSON.stringify({ 
          error: `Invalid action: ${action}. Supported actions: create_order, verify_payment`,
          code: 'INVALID_ACTION'
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
  } catch (error) {
    console.error('💥 Razorpay function error:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        code: 'FUNCTION_ERROR',
        timestamp: new Date().toISOString()
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function createRazorpayOrder({ amount, booking_id }: CreateOrderRequest, keyId: string, keySecret: string) {
  console.log('💳 Creating Razorpay order for amount: ₹', amount, 'booking:', booking_id);

  // Validate amount
  if (!amount || amount <= 0) {
    throw new Error(`Invalid amount: ${amount}. Amount must be greater than 0.`);
  }

  try {
    // Generate short receipt (max 40 chars for Razorpay)
    const shortBookingId = booking_id.substring(0, 20);
    const timestamp = Date.now().toString().slice(-8); // Last 8 digits
    const receipt = `rcpt_${shortBookingId}_${timestamp}`.substring(0, 40);

    const orderData = {
      amount: Math.round(amount * 100), // Convert to paise (₹1 = 100 paise)
      currency: 'INR',
      receipt: receipt,
      payment_capture: 1,
      notes: {
        booking_id: booking_id,
        amount_inr: amount,
        purpose: 'Study Hall Booking'
      }
    };

    console.log('📄 Generated receipt:', receipt, '(length:', receipt.length, ')');

    console.log('📤 Sending order request to Razorpay:', JSON.stringify(orderData, null, 2));

    const auth = btoa(`${keyId}:${keySecret}`);
    
    const response = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json',
        'User-Agent': 'StudyHall-Payment/1.0'
      },
      body: JSON.stringify(orderData)
    });

    const responseText = await response.text();
    console.log('📊 Razorpay API response status:', response.status);
    console.log('📥 Razorpay API response:', responseText);
    console.log('🌐 Response headers:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      console.error('❌ Razorpay API Error - Status:', response.status);
      console.error('❌ Razorpay API Error - Response:', responseText);
      
      // Provide specific error messages based on status codes
      let errorMessage = 'Failed to create Razorpay order';
      if (response.status === 401) {
        errorMessage = 'Invalid Razorpay credentials. Please contact support.';
      } else if (response.status === 400) {
        errorMessage = 'Invalid order data. Please check the amount and try again.';
      } else if (response.status >= 500) {
        errorMessage = 'Razorpay service is temporarily unavailable. Please try again later.';
      }
      
      return new Response(
        JSON.stringify({ 
          error: errorMessage,
          code: 'RAZORPAY_API_ERROR',
          details: responseText,
          status: response.status 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const order = JSON.parse(responseText);
    console.log('✅ Razorpay order created successfully:', order.id);

    return new Response(
      JSON.stringify({ 
        success: true, 
        order_id: order.id,
        amount: order.amount,
        currency: order.currency,
        key_id: keyId,
        receipt: order.receipt 
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('💥 Error creating Razorpay order:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Failed to create order', 
        code: 'ORDER_CREATION_FAILED',
        details: error.message 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}

async function verifyRazorpayPayment(
  { razorpay_payment_id, razorpay_order_id, razorpay_signature, transaction_id }: VerifyPaymentRequest,
  supabase: any,
  keySecret: string
) {
  console.log('🔍 Verifying Razorpay payment:', razorpay_payment_id);

  try {
    // Verify signature
    const generated_signature = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(keySecret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    ).then(key => 
      crypto.subtle.sign(
        'HMAC',
        key,
        new TextEncoder().encode(`${razorpay_order_id}|${razorpay_payment_id}`)
      )
    ).then(signature => 
      Array.from(new Uint8Array(signature))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('')
    );

    console.log('🔐 Generated signature:', generated_signature);
    console.log('📝 Received signature:', razorpay_signature);

    if (generated_signature !== razorpay_signature) {
      console.error('❌ Invalid payment signature - possible tampering or incorrect secret key');
      return new Response(
        JSON.stringify({ 
          error: 'Invalid payment signature - payment verification failed',
          code: 'SIGNATURE_MISMATCH'
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Update transaction status
    const { error: updateError } = await supabase
      .from('transactions')
      .update({ 
        status: 'completed',
        payment_id: razorpay_payment_id,
        payment_data: {
          razorpay_payment_id,
          razorpay_order_id,
          razorpay_signature,
          verified_at: new Date().toISOString()
        }
      })
      .eq('id', transaction_id);

    if (updateError) {
      console.error('Error updating transaction:', updateError);
      return new Response(
        JSON.stringify({ error: 'Failed to update transaction status' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('✅ Payment verified and transaction updated successfully');

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Payment verified successfully',
        transaction_id: transaction_id,
        payment_id: razorpay_payment_id
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('💥 Error verifying payment:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Failed to verify payment', 
        code: 'VERIFICATION_FAILED',
        details: error.message 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}