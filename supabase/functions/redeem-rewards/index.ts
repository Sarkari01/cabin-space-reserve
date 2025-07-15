import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface RedeemRewardsRequest {
  points_to_redeem: number;
  booking_id?: string;
}

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[REDEEM-REWARDS] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    logStep("Function started");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header provided");
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    
    const user = userData.user;
    if (!user) throw new Error("User not authenticated");
    logStep("User authenticated", { userId: user.id });

    const { points_to_redeem, booking_id }: RedeemRewardsRequest = await req.json();
    logStep("Request data", { points_to_redeem, booking_id });

    // Validate points amount
    if (!points_to_redeem || points_to_redeem <= 0) {
      return new Response(
        JSON.stringify({ success: false, error: "Invalid points amount" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    // Check minimum redemption (50 points = ₹1)
    if (points_to_redeem < 50) {
      return new Response(
        JSON.stringify({ success: false, error: "Minimum redemption is 50 points (₹1)" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    // Get user's current rewards
    const { data: userRewards, error: rewardsError } = await supabaseClient
      .from("rewards")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (rewardsError || !userRewards) {
      logStep("User rewards not found", { error: rewardsError });
      return new Response(
        JSON.stringify({ success: false, error: "User rewards not found" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 404 }
      );
    }

    // Check if user has enough points
    if (userRewards.available_points < points_to_redeem) {
      logStep("Insufficient points", { 
        available: userRewards.available_points, 
        requested: points_to_redeem 
      });
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `Insufficient points. You have ${userRewards.available_points} points available.` 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    // Calculate discount amount (50 points = ₹1)
    const discount_amount = points_to_redeem / 50;

    // Process the redemption
    await supabaseClient.rpc('update_user_rewards', {
      p_user_id: user.id,
      p_points: points_to_redeem,
      p_type: 'redeemed',
      p_reason: 'Booking discount redemption',
      p_booking_id: booking_id || null
    });

    logStep("Rewards redeemed successfully", { 
      points_redeemed: points_to_redeem, 
      discount_amount 
    });

    // Create notification
    await supabaseClient
      .from("notifications")
      .insert({
        user_id: user.id,
        title: "Rewards Redeemed!",
        message: `You redeemed ${points_to_redeem} points for ₹${discount_amount} discount!`,
        type: "success",
        action_url: "/student/dashboard"
      });

    return new Response(JSON.stringify({ 
      success: true, 
      points_redeemed: points_to_redeem,
      discount_amount,
      remaining_points: userRewards.available_points - points_to_redeem,
      message: `Successfully redeemed ${points_to_redeem} points for ₹${discount_amount} discount!`
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in redeem-rewards", { message: errorMessage });
    return new Response(JSON.stringify({ success: false, error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});