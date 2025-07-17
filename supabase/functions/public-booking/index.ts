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

interface PublicBookingRequest {
  studyHallId: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { studyHallId }: PublicBookingRequest = await req.json();

    if (!studyHallId) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Study hall ID is required' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('Fetching study hall data for ID:', studyHallId);

    // Fetch study hall details
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
      .single();

    if (studyHallError || !studyHall) {
      console.error('Study hall not found:', studyHallError);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Study hall not found or not available for booking' 
        }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    if (!studyHall.qr_booking_enabled) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'QR booking is disabled for this study hall' 
        }),
        { 
          status: 403, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Fetch all seats for this study hall
    const { data: seats, error: seatsError } = await supabase
      .from('seats')
      .select('*')
      .eq('study_hall_id', studyHallId)
      .order('row_name')
      .order('seat_number');

    if (seatsError) {
      console.error('Error fetching seats:', seatsError);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Failed to fetch seat information' 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Get available seats count
    const availableSeats = seats?.filter(seat => seat.is_available).length || 0;

    console.log(`Found ${seats?.length || 0} total seats, ${availableSeats} available`);

    return new Response(
      JSON.stringify({
        success: true,
        studyHall,
        seats: seats || [],
        availableSeats
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error: any) {
    console.error('Error in public-booking function:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
};

serve(handler);