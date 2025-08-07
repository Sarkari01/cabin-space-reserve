import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const { action, bookingId, reason } = await req.json();

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ success: false, error: 'Authentication required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check user role and permissions
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile) {
      return new Response(
        JSON.stringify({ success: false, error: 'User profile not found' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'vacate') {
      // Validate booking exists and permissions
      const { data: booking } = await supabase
        .from('cabin_bookings')
        .select(`
          *,
          private_hall:private_halls!cabin_bookings_private_hall_id_fkey(merchant_id)
        `)
        .eq('id', bookingId)
        .single();

      if (!booking) {
        return new Response(
          JSON.stringify({ success: false, error: 'Booking not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Check permissions: admin can vacate any booking, merchant can vacate their own private hall bookings
      const isAdmin = profile.role === 'admin';
      const isMerchantOfHall = profile.role === 'merchant' && booking.private_hall?.merchant_id === user.id;
      
      if (!isAdmin && !isMerchantOfHall) {
        return new Response(
          JSON.stringify({ success: false, error: 'Insufficient permissions to vacate this booking' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Call the database function to vacate the booking
      const { data: result, error: vacateError } = await supabase
        .rpc('vacate_cabin_booking', {
          p_booking_id: bookingId,
          p_vacated_by_user_id: user.id,
          p_reason: reason || 'Manual vacation by ' + profile.role
        });

      if (vacateError) {
        console.error('Error vacating cabin booking:', vacateError);
        return new Response(
          JSON.stringify({ success: false, error: vacateError.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify(result),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } else if (action === 'auto-expire') {
      // Only allow admin to trigger manual auto-expire
      if (profile.role !== 'admin') {
        return new Response(
          JSON.stringify({ success: false, error: 'Only admins can trigger auto-expiration' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Call the database function to auto-expire bookings
      const { data: result, error: expireError } = await supabase
        .rpc('auto_expire_cabin_bookings');

      if (expireError) {
        console.error('Error auto-expiring cabin bookings:', expireError);
        return new Response(
          JSON.stringify({ success: false, error: expireError.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify(result),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } else if (action === 'get-status') {
      // Get cabin availability status
      const { cabinId } = await req.json();
      
      const { data: status, error: statusError } = await supabase
        .rpc('get_cabin_availability_status', { p_cabin_id: cabinId });

      if (statusError) {
        console.error('Error getting cabin status:', statusError);
        return new Response(
          JSON.stringify({ success: false, error: statusError.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ success: true, status: status[0] }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ success: false, error: 'Invalid action' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Cabin vacate function error:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});