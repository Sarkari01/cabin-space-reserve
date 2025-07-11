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

    const { action, orderId, paymentId, signature, amount, bookingId } = await req.json();

    switch (action) {
      case 'createOrder':
        return await createOrder(amount, bookingId);
      case 'verifyPayment':
        return await verifyPayment(orderId, paymentId, signature, bookingId, supabase);
      default:
        throw new Error('Invalid action');
    }
  } catch (error) {
    console.error('Razorpay Payment Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

async function createOrder(amount: number, bookingId: string) {
  const RAZORPAY_SECRET_KEY = Deno.env.get('RAZORPAY_SECRET_KEY');
  
  if (!RAZORPAY_SECRET_KEY) {
    throw new Error('Razorpay Secret Key not configured in project secrets');
  }

  // Get Razorpay Key ID from business settings  
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
  );

  const { data: settings, error } = await supabase
    .from('business_settings')
    .select('razorpay_key_id')
    .single();

  if (error || !settings?.razorpay_key_id) {
    throw new Error('Razorpay Key ID not configured in business settings');
  }

  const orderData = {
    amount: amount * 100, // Razorpay expects amount in paise
    currency: 'INR',
    receipt: `booking_${bookingId}_${Date.now()}`,
  };

  const response = await fetch('https://api.razorpay.com/v1/orders', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Basic ${btoa(RAZORPAY_SECRET_KEY + ':')}`,
    },
    body: JSON.stringify(orderData),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to create Razorpay order: ${error}`);
  }

  const order = await response.json();
  
  return new Response(
    JSON.stringify({ 
      success: true, 
      orderId: order.id,
      amount: order.amount,
      currency: order.currency
    }),
    { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    }
  );
}

async function verifyPayment(orderId: string, paymentId: string, signature: string, bookingId: string, supabase: any) {
  const RAZORPAY_SECRET_KEY = Deno.env.get('RAZORPAY_SECRET_KEY');
  
  if (!RAZORPAY_SECRET_KEY) {
    throw new Error('Razorpay secret key not configured');
  }

  // Verify signature
  const crypto = await import('https://deno.land/std@0.168.0/crypto/mod.ts');
  const expectedSignature = await crypto.crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(`${orderId}|${paymentId}${RAZORPAY_SECRET_KEY}`)
  );
  
  const expectedSignatureHex = Array.from(new Uint8Array(expectedSignature))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');

  if (expectedSignatureHex !== signature) {
    throw new Error('Invalid payment signature');
  }

  // Update transaction status
  const { error } = await supabase
    .from('transactions')
    .update({ 
      status: 'completed',
      payment_id: paymentId,
      payment_data: { orderId, paymentId, signature }
    })
    .eq('booking_id', bookingId)
    .eq('payment_method', 'razorpay');

  if (error) {
    throw new Error(`Failed to update transaction: ${error.message}`);
  }

  return new Response(
    JSON.stringify({ 
      success: true, 
      message: 'Payment verified successfully'
    }),
    { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    }
  );
}