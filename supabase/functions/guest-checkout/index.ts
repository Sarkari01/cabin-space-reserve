import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

interface GuestBookingRequest {
  studyHallId: string;
  seatId: string;
  startDate: string;
  endDate: string;
  guestName: string;
  guestPhone: string;
  guestEmail: string;
  paymentMethod: 'razorpay' | 'ekqr';
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const {
      studyHallId,
      seatId,
      startDate,
      endDate,
      guestName,
      guestPhone,
      guestEmail,
      paymentMethod
    }: GuestBookingRequest = await req.json();

    // Validate required fields
    if (!studyHallId || !seatId || !startDate || !endDate || !guestName || !guestPhone || !paymentMethod) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify study hall exists and QR booking is enabled
    const { data: studyHall, error: studyHallError } = await supabase
      .from('study_halls')
      .select('id, name, daily_price, weekly_price, monthly_price, qr_booking_enabled, status')
      .eq('id', studyHallId)
      .eq('status', 'active')
      .eq('qr_booking_enabled', true)
      .single();

    if (studyHallError || !studyHall) {
      return new Response(
        JSON.stringify({ error: 'Study hall not found or QR booking is disabled' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify seat exists and is available
    const { data: seat, error: seatError } = await supabase
      .from('seats')
      .select('id, seat_id, is_available')
      .eq('id', seatId)
      .eq('study_hall_id', studyHallId)
      .single();

    if (seatError || !seat) {
      return new Response(
        JSON.stringify({ error: 'Seat not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!seat.is_available) {
      return new Response(
        JSON.stringify({ error: 'Seat is not available' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check for conflicting bookings
    const { data: conflictingBookings, error: conflictError } = await supabase
      .from('bookings')
      .select('id')
      .eq('seat_id', seatId)
      .in('status', ['active', 'confirmed', 'pending'])
      .or(`start_date.lte.${endDate},end_date.gte.${startDate}`);

    if (conflictError) {
      console.error('Error checking for conflicts:', conflictError);
      return new Response(
        JSON.stringify({ error: 'Failed to verify seat availability' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (conflictingBookings && conflictingBookings.length > 0) {
      return new Response(
        JSON.stringify({ error: 'Seat is already booked for the selected dates' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Calculate booking amount
    const start = new Date(startDate);
    const end = new Date(endDate);
    const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    
    let totalAmount = days * studyHall.daily_price;
    let bookingPeriod = 'daily';

    // Optimize for weekly/monthly pricing
    if (days >= 30) {
      const monthlyTotal = Math.ceil(days / 30) * studyHall.monthly_price;
      if (monthlyTotal < totalAmount) {
        totalAmount = monthlyTotal;
        bookingPeriod = 'monthly';
      }
    } else if (days >= 7) {
      const weeklyTotal = Math.ceil(days / 7) * studyHall.weekly_price;
      if (weeklyTotal < totalAmount) {
        totalAmount = weeklyTotal;
        bookingPeriod = 'weekly';
      }
    }

    // Create guest booking
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .insert({
        study_hall_id: studyHallId,
        seat_id: seatId,
        start_date: startDate,
        end_date: endDate,
        total_amount: totalAmount,
        booking_period: bookingPeriod,
        status: 'pending',
        payment_status: 'unpaid',
        guest_name: guestName,
        guest_phone: guestPhone,
        guest_email: guestEmail,
        user_id: null // Guest booking
      })
      .select()
      .single();

    if (bookingError) {
      console.error('Error creating booking:', bookingError);
      return new Response(
        JSON.stringify({ error: 'Failed to create booking' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create transaction record
    const { data: transaction, error: transactionError } = await supabase
      .from('transactions')
      .insert({
        booking_id: booking.id,
        amount: totalAmount,
        payment_method: paymentMethod,
        status: 'pending',
        user_id: null // Guest transaction
      })
      .select()
      .single();

    if (transactionError) {
      console.error('Error creating transaction:', transactionError);
      return new Response(
        JSON.stringify({ error: 'Failed to create transaction' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Mark seat as temporarily unavailable
    await supabase
      .from('seats')
      .update({ is_available: false })
      .eq('id', seatId);

    console.log(`Guest booking created: ${booking.id} for ${guestName}`);

    return new Response(
      JSON.stringify({
        success: true,
        booking: {
          id: booking.id,
          bookingNumber: booking.booking_number,
          studyHallName: studyHall.name,
          seatId: seat.seat_id,
          totalAmount,
          bookingPeriod,
          startDate,
          endDate,
          guestName,
          guestPhone,
          guestEmail
        },
        transaction: {
          id: transaction.id,
          transactionNumber: transaction.transaction_number,
          amount: totalAmount,
          paymentMethod
        }
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error in guest-checkout function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
};

serve(handler);