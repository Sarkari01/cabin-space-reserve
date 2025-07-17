import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Create Supabase client with service role for bypassing RLS
const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const studyHallId = body.studyHallId;

    if (!studyHallId) {
      return new Response(
        JSON.stringify({ error: 'Study hall ID is required in request body' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Fetching data for study hall: ${studyHallId}`);

    // Fetch study hall details with seat information
    const { data: studyHall, error: studyHallError } = await supabase
      .from('study_halls')
      .select(`
        id,
        name,
        description,
        location,
        formatted_address,
        daily_price,
        weekly_price,
        monthly_price,
        amenities,
        image_url,
        total_seats,
        rows,
        seats_per_row,
        custom_row_names,
        layout_mode,
        row_seat_config,
        qr_booking_enabled,
        status
      `)
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

    // Fetch seat availability
    const { data: seats, error: seatsError } = await supabase
      .from('seats')
      .select('id, seat_id, row_name, seat_number, is_available')
      .eq('study_hall_id', studyHallId)
      .order('row_name')
      .order('seat_number');

    if (seatsError) {
      console.error('Error fetching seats:', seatsError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch seat information' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch current bookings to determine real-time availability
    const today = new Date().toISOString().split('T')[0];
    const { data: activeBookings, error: bookingsError } = await supabase
      .from('bookings')
      .select('seat_id, start_date, end_date')
      .eq('study_hall_id', studyHallId)
      .in('status', ['active', 'confirmed', 'pending'])
      .gte('end_date', today);

    if (bookingsError) {
      console.error('Error fetching bookings:', bookingsError);
    }

    // Calculate real-time seat availability
    const availabilityMap = new Map();
    seats?.forEach(seat => {
      availabilityMap.set(seat.id, seat.is_available);
    });

    // Mark seats as unavailable if they have active bookings
    activeBookings?.forEach(booking => {
      const startDate = new Date(booking.start_date);
      const endDate = new Date(booking.end_date);
      const currentDate = new Date();
      
      // If booking is active (current date is within booking period)
      if (currentDate >= startDate && currentDate <= endDate) {
        availabilityMap.set(booking.seat_id, false);
      }
    });

    // Update seat availability
    const updatedSeats = seats?.map(seat => ({
      ...seat,
      is_available: availabilityMap.get(seat.id) ?? false
    }));

    const response = {
      studyHall: {
        ...studyHall,
        amenities: studyHall.amenities || []
      },
      seats: updatedSeats || [],
      availableSeats: updatedSeats?.filter(seat => seat.is_available).length || 0,
      totalSeats: studyHall.total_seats
    };

    return new Response(
      JSON.stringify(response),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (parseError: any) {
    console.error('Error parsing request body:', parseError);
    return new Response(
      JSON.stringify({ error: 'Invalid request body' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Error in public-booking function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
};

serve(handler);