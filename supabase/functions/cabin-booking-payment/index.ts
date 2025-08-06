import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface CreatePaymentRequest {
  action: 'create';
  bookingId: string;
  amount: number;
}

interface VerifyPaymentRequest {
  action: 'verify';
  bookingId: string;
  paymentResponse: any;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Health check
  if (req.method === 'GET') {
    return new Response(JSON.stringify({ status: 'ok' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const { action, ...requestData } = await req.json();

    if (action === 'create') {
      return await createCabinBookingOrder(requestData as Omit<CreatePaymentRequest, 'action'>);
    } else if (action === 'verify') {
      return await verifyCabinBookingPayment(requestData as Omit<VerifyPaymentRequest, 'action'>);
    } else {
      return new Response(
        JSON.stringify({ error: 'Invalid action' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
})

async function createCabinBookingOrder(request: Omit<CreatePaymentRequest, 'action'>) {
  console.log('Creating payment order for booking:', request.bookingId);
  
  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Enhanced booking validation with simplified queries to avoid relationship ambiguity
    const { data: booking, error: bookingError } = await supabase
      .from('cabin_bookings')
      .select('*')
      .eq('id', request.bookingId)
      .single();

    if (bookingError) {
      console.error('Database error fetching booking:', bookingError);
      return new Response(
        JSON.stringify({ 
          error: 'Database error fetching booking',
          details: bookingError.message 
        }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    if (!booking) {
      console.error('Booking not found for ID:', request.bookingId);
      return new Response(
        JSON.stringify({ error: 'Booking not found' }),
        { 
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Fetch private hall details separately
    const { data: privateHall, error: hallError } = await supabase
      .from('private_halls')
      .select('name, merchant_id, status')
      .eq('id', booking.private_hall_id)
      .single();

    if (hallError || !privateHall) {
      console.error('Error fetching private hall:', hallError);
      return new Response(
        JSON.stringify({ 
          error: 'Private hall not found',
          details: hallError?.message 
        }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Fetch cabin details separately
    const { data: cabin, error: cabinError } = await supabase
      .from('cabins')
      .select('cabin_name, status')
      .eq('id', booking.cabin_id)
      .single();

    if (cabinError || !cabin) {
      console.error('Error fetching cabin:', cabinError);
      return new Response(
        JSON.stringify({ 
          error: 'Cabin not found',
          details: cabinError?.message 
        }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }


    // Validate booking status
    if (booking.status !== 'pending') {
      console.error('Invalid booking status:', booking.status);
      return new Response(
        JSON.stringify({ 
          error: 'Booking is not in pending status',
          current_status: booking.status
        }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    if (booking.payment_status === 'paid') {
      console.error('Booking already paid');
      return new Response(
        JSON.stringify({ error: 'Booking is already paid' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log('Found valid booking:', booking.id);

    // Get Razorpay credentials
    const razorpayKeyId = Deno.env.get('RAZORPAY_KEY_ID');
    const razorpayKeySecret = Deno.env.get('RAZORPAY_KEY_SECRET');

    if (!razorpayKeyId || !razorpayKeySecret) {
      console.error('Razorpay credentials missing');
      return new Response(
        JSON.stringify({ error: 'Payment gateway not configured' }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Create enhanced Razorpay order
    const orderData = {
      amount: Math.round(request.amount * 100), // Convert to paise
      currency: 'INR',
      receipt: `cb_${request.bookingId.slice(-28)}`, // Max 40 chars: "cb_" (3) + 28 chars from UUID = 31 chars
        notes: {
          booking_id: request.bookingId,
          cabin_id: booking.cabin_id,
          private_hall_id: booking.private_hall_id,
          cabin_name: cabin.cabin_name,
          hall_name: privateHall.name,
          months_booked: booking.months_booked.toString(),
          monthly_amount: booking.monthly_amount.toString(),
          type: 'cabin_booking'
        }
    };

    console.log('Creating Razorpay order with data:', orderData);

    const auth = btoa(`${razorpayKeyId}:${razorpayKeySecret}`);
    
    const razorpayResponse = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(orderData),
    });

    if (!razorpayResponse.ok) {
      const errorText = await razorpayResponse.text();
      console.error('Razorpay API error:', razorpayResponse.status, errorText);
      return new Response(
        JSON.stringify({ 
          error: 'Payment gateway error',
          status: razorpayResponse.status,
          details: errorText
        }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const razorpayOrder = await razorpayResponse.json();
    console.log('Razorpay order created successfully:', razorpayOrder.id);

    // Update booking with Razorpay order ID
    const { error: updateError } = await supabase
      .from('cabin_bookings')
      .update({ razorpay_order_id: razorpayOrder.id })
      .eq('id', request.bookingId);

    if (updateError) {
      console.error('Error updating booking with order ID:', updateError);
    }

    return new Response(
      JSON.stringify({
        orderId: razorpayOrder.id,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        keyId: razorpayKeyId,
        bookingDetails: {
          id: booking.id,
          cabin_name: cabin.cabin_name,
          hall_name: privateHall.name,
          start_date: booking.start_date,
          end_date: booking.end_date,
          total_amount: booking.total_amount
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error creating payment order:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to create payment order' }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
}

async function verifyCabinBookingPayment(request: Omit<VerifyPaymentRequest, 'action'>) {
  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { paymentResponse } = request;
    const razorpayKeySecret = Deno.env.get('RAZORPAY_KEY_SECRET');

    if (!razorpayKeySecret) {
      return new Response(
        JSON.stringify({ error: 'Payment verification not configured' }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Verify payment signature
    const crypto = await import('node:crypto');
    const expectedSignature = crypto
      .createHmac('sha256', razorpayKeySecret)
      .update(`${paymentResponse.razorpay_order_id}|${paymentResponse.razorpay_payment_id}`)
      .digest('hex');

    if (expectedSignature !== paymentResponse.razorpay_signature) {
      console.error('Payment signature verification failed');
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Payment verification failed' 
        }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Update booking status to paid and active
    const { data: updatedBooking, error: updateError } = await supabase
      .from('cabin_bookings')
      .update({
        payment_status: 'paid',
        status: 'active',
        razorpay_payment_id: paymentResponse.razorpay_payment_id,
        updated_at: new Date().toISOString()
      })
      .eq('id', request.bookingId)
      .select('*')
      .single();

    if (updateError) {
      console.error('Error updating booking:', updateError);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Failed to update booking status' 
        }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Update cabin status to occupied using cabin_id from the booking
    const { error: cabinUpdateError } = await supabase
      .from('cabins')
      .update({ status: 'occupied' })
      .eq('id', updatedBooking.cabin_id);

    if (cabinUpdateError) {
      console.error('Error updating cabin status:', cabinUpdateError);
      // Don't fail the whole operation for this
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Payment verified and booking confirmed',
        booking: updatedBooking
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error verifying payment:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Payment verification failed' 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
}