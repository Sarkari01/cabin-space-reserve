import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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

    const requestBody = await req.json();
    console.log('Razorpay function called with request:', requestBody);
    const { action, ...requestData } = requestBody;
    console.log('Razorpay function called with action:', action);

    if (action === 'create_order') {
      return await createRazorpayOrder(requestData as CreateOrderRequest);
    } else if (action === 'verify_payment') {
      return await verifyRazorpayPayment(requestData as VerifyPaymentRequest, supabase);
    } else {
      return new Response(
        JSON.stringify({ error: 'Invalid action' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
  } catch (error) {
    console.error('Razorpay function error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function createRazorpayOrder({ amount, booking_id }: CreateOrderRequest) {
  console.log('Creating Razorpay order for amount:', amount, 'booking:', booking_id);

  const keyId = Deno.env.get('RAZORPAY_KEY_ID');
  const keySecret = Deno.env.get('RAZORPAY_KEY_SECRET');

  if (!keyId || !keySecret) {
    console.error('Missing Razorpay credentials');
    return new Response(
      JSON.stringify({ error: 'Razorpay credentials not configured' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    const orderData = {
      amount: Math.round(amount * 100), // Convert to paise
      currency: 'INR',
      receipt: `booking_${booking_id}_${Date.now()}`,
      payment_capture: 1
    };

    console.log('Sending order request to Razorpay:', orderData);

    const auth = btoa(`${keyId}:${keySecret}`);
    
    const response = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(orderData)
    });

    const responseText = await response.text();
    console.log('Razorpay API response status:', response.status);
    console.log('Razorpay API response:', responseText);

    if (!response.ok) {
      return new Response(
        JSON.stringify({ 
          error: 'Failed to create Razorpay order', 
          details: responseText,
          status: response.status 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const order = JSON.parse(responseText);
    console.log('Razorpay order created successfully:', order.id);

    return new Response(
      JSON.stringify({ 
        success: true, 
        order_id: order.id,
        amount: order.amount,
        currency: order.currency,
        key_id: keyId 
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error creating Razorpay order:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to create order', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}

async function verifyRazorpayPayment(
  { razorpay_payment_id, razorpay_order_id, razorpay_signature, transaction_id }: VerifyPaymentRequest,
  supabase: any
) {
  console.log('Verifying Razorpay payment:', razorpay_payment_id);

  const keySecret = Deno.env.get('RAZORPAY_KEY_SECRET');
  
  if (!keySecret) {
    console.error('Missing Razorpay secret key');
    return new Response(
      JSON.stringify({ error: 'Razorpay credentials not configured' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

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

    console.log('Generated signature:', generated_signature);
    console.log('Received signature:', razorpay_signature);

    if (generated_signature !== razorpay_signature) {
      console.error('Invalid signature');
      return new Response(
        JSON.stringify({ error: 'Invalid payment signature' }),
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

    console.log('Payment verified and transaction updated successfully');

    return new Response(
      JSON.stringify({ success: true, message: 'Payment verified successfully' }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error verifying payment:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to verify payment', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}