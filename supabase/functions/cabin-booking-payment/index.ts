import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface CreatePaymentRequest {
  action: 'create_order';
  booking_id: string;
  amount: number;
}

interface VerifyPaymentRequest {
  action: 'verify_payment';
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
  booking_id: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Health check endpoint
  if (req.url.endsWith('/health')) {
    return new Response(JSON.stringify({ status: 'healthy' }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  }

  try {
    const { action, ...requestData } = await req.json();

    // Validate Razorpay credentials
    const razorpayKeyId = Deno.env.get('RAZORPAY_KEY_ID');
    const razorpayKeySecret = Deno.env.get('RAZORPAY_KEY_SECRET');

    if (!razorpayKeyId || !razorpayKeySecret) {
      throw new Error('Razorpay credentials not configured');
    }

    if (action === 'create_order') {
      return await createCabinBookingOrder(requestData as CreatePaymentRequest);
    } else if (action === 'verify_payment') {
      return await verifyCabinBookingPayment(requestData as VerifyPaymentRequest);
    } else {
      throw new Error(`Invalid action: ${action}`);
    }
  } catch (error) {
    console.error('Function error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});

async function createCabinBookingOrder(data: CreatePaymentRequest) {
  try {
    // Create Supabase client
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Fetch booking details
    const { data: booking, error: bookingError } = await supabase
      .from('cabin_bookings')
      .select(`
        *,
        cabins (*, private_halls (*))
      `)
      .eq('id', data.booking_id)
      .single();

    if (bookingError || !booking) {
      console.error('Booking fetch error:', bookingError);
      throw new Error('Booking not found');
    }

    // Generate receipt
    const receipt = `cabin_booking_${booking.booking_number || booking.id.slice(-8)}`;

    // Create Razorpay order
    const orderData = {
      amount: Math.round(data.amount * 100), // Convert to paise
      currency: 'INR',
      receipt,
      notes: {
        booking_id: data.booking_id,
        cabin_id: booking.cabin_id,
        private_hall_id: booking.private_hall_id,
        months_booked: booking.months_booked.toString(),
      }
    };

    console.log('Creating Razorpay order:', orderData);

    const response = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${btoa(`${Deno.env.get('RAZORPAY_KEY_ID')}:${Deno.env.get('RAZORPAY_KEY_SECRET')}`)}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(orderData),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Razorpay API error:', errorData);
      throw new Error(`Razorpay API error: ${response.status} - ${errorData}`);
    }

    const order = await response.json();
    console.log('Razorpay order created:', order);

    // Update booking with payment details
    await supabase
      .from('cabin_bookings')
      .update({
        razorpay_order_id: order.id,
        updated_at: new Date().toISOString(),
      })
      .eq('id', data.booking_id);

    return new Response(JSON.stringify({
      order_id: order.id,
      amount: order.amount,
      currency: order.currency,
      key_id: Deno.env.get('RAZORPAY_KEY_ID'),
      booking_details: {
        cabin_name: booking.cabins?.cabin_name,
        hall_name: booking.cabins?.private_halls?.name,
        months: booking.months_booked,
      }
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error('Error creating cabin booking order:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      details: 'Failed to create Razorpay order for cabin booking'
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
}

async function verifyCabinBookingPayment(data: VerifyPaymentRequest) {
  try {
    const keySecret = Deno.env.get('RAZORPAY_KEY_SECRET');
    
    if (!keySecret) {
      throw new Error('Razorpay key secret not configured');
    }

    // Verify signature
    const body = data.razorpay_order_id + "|" + data.razorpay_payment_id;
    const expectedSignature = await crypto.subtle
      .importKey(
        "raw",
        new TextEncoder().encode(keySecret),
        { name: "HMAC", hash: "SHA-256" },
        false,
        ["sign"]
      )
      .then(key =>
        crypto.subtle.sign("HMAC", key, new TextEncoder().encode(body))
      )
      .then(signature => {
        const signatureArray = new Uint8Array(signature);
        return Array.from(signatureArray)
          .map(b => b.toString(16).padStart(2, '0'))
          .join('');
      });

    console.log('Signature verification:', {
      expected: expectedSignature,
      received: data.razorpay_signature,
      match: expectedSignature === data.razorpay_signature
    });

    if (expectedSignature !== data.razorpay_signature) {
      throw new Error('Invalid payment signature');
    }

    // Create Supabase client
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Update cabin booking
    const { data: booking, error: updateError } = await supabase
      .from('cabin_bookings')
      .update({
        payment_status: 'paid',
        status: 'active',
        razorpay_payment_id: data.razorpay_payment_id,
        updated_at: new Date().toISOString(),
      })
      .eq('id', data.booking_id)
      .select('*, cabins(*)')
      .single();

    if (updateError) {
      console.error('Booking update error:', updateError);
      throw new Error(`Failed to update booking: ${updateError.message}`);
    }

    console.log('Booking updated successfully:', booking);

    // Update cabin status to occupied
    const { error: cabinUpdateError } = await supabase
      .from('cabins')
      .update({ 
        status: 'occupied',
        updated_at: new Date().toISOString(),
      })
      .eq('id', booking.cabin_id);

    if (cabinUpdateError) {
      console.error('Cabin update error:', cabinUpdateError);
      // Don't fail the whole operation for this
    }

    return new Response(JSON.stringify({
      success: true,
      message: 'Payment verified and booking confirmed',
      booking_id: data.booking_id,
      payment_id: data.razorpay_payment_id,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error('Error verifying cabin booking payment:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      details: 'Payment verification failed'
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
}