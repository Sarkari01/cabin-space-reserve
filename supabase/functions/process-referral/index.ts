import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ProcessReferralRequest {
  referral_code: string;
  booking_id?: string;
}

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[PROCESS-REFERRAL] ${step}${detailsStr}`);
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

    const { referral_code, booking_id }: ProcessReferralRequest = await req.json();
    logStep("Request data", { referral_code, booking_id });

    // Find referral code
    const { data: referralCodeData, error: referralError } = await supabaseClient
      .from("referral_codes")
      .select("*")
      .eq("code", referral_code.toUpperCase())
      .eq("status", "active")
      .single();

    if (referralError || !referralCodeData) {
      logStep("Referral code not found", { referral_code });
      return new Response(
        JSON.stringify({ success: false, error: "Invalid referral code" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    // Check if user is trying to refer themselves
    if (referralCodeData.user_id === user.id) {
      logStep("Self-referral attempt", { user_id: user.id, referrer_id: referralCodeData.user_id });
      return new Response(
        JSON.stringify({ success: false, error: "You cannot use your own referral code" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    // Check if user has already been referred by this code
    const { data: existingReferral } = await supabaseClient
      .from("referral_rewards")
      .select("id")
      .eq("referee_id", user.id)
      .eq("referral_code_id", referralCodeData.id)
      .single();

    if (existingReferral) {
      logStep("User already referred by this code", { existing_referral_id: existingReferral.id });
      return new Response(
        JSON.stringify({ success: false, error: "You have already used this referral code" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    // Check monthly referral limit for referrer (max 10 per month)
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const { data: monthlyReferrals } = await supabaseClient
      .from("referral_rewards")
      .select("id")
      .eq("referrer_id", referralCodeData.user_id)
      .gte("created_at", startOfMonth.toISOString())
      .eq("status", "completed");

    if (monthlyReferrals && monthlyReferrals.length >= 10) {
      logStep("Monthly referral limit reached", { monthly_count: monthlyReferrals.length });
      return new Response(
        JSON.stringify({ success: false, error: "Referral limit reached for this month" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    // Define reward amounts
    const REFERRER_REWARD_POINTS = 1000;
    const REFEREE_REWARD_POINTS = 500;

    // Create referral reward record
    const { data: referralReward, error: createError } = await supabaseClient
      .from("referral_rewards")
      .insert({
        referrer_id: referralCodeData.user_id,
        referee_id: user.id,
        referral_code_id: referralCodeData.id,
        booking_id: booking_id || null,
        referrer_reward_points: REFERRER_REWARD_POINTS,
        referee_reward_points: REFEREE_REWARD_POINTS,
        status: booking_id ? 'completed' : 'pending'
      })
      .select()
      .single();

    if (createError) {
      logStep("Error creating referral reward", { error: createError });
      throw new Error("Failed to process referral");
    }

    logStep("Referral reward created", { referral_reward_id: referralReward.id });

    // If booking_id is provided, complete the referral immediately
    if (booking_id) {
      // Award points to both users
      await supabaseClient.rpc('update_user_rewards', {
        p_user_id: referralCodeData.user_id,
        p_points: REFERRER_REWARD_POINTS,
        p_type: 'earned',
        p_reason: 'Referral reward',
        p_booking_id: booking_id,
        p_referral_id: referralReward.id
      });

      await supabaseClient.rpc('update_user_rewards', {
        p_user_id: user.id,
        p_points: REFEREE_REWARD_POINTS,
        p_type: 'earned',
        p_reason: 'Referral bonus',
        p_booking_id: booking_id,
        p_referral_id: referralReward.id
      });

      // Update referral code statistics
      await supabaseClient
        .from("referral_codes")
        .update({
          total_referrals: referralCodeData.total_referrals + 1,
          successful_referrals: referralCodeData.successful_referrals + 1,
          total_earnings: referralCodeData.total_earnings + REFERRER_REWARD_POINTS,
          updated_at: new Date().toISOString()
        })
        .eq("id", referralCodeData.id);

      // Mark referral as completed
      await supabaseClient
        .from("referral_rewards")
        .update({
          status: 'completed',
          completed_at: new Date().toISOString()
        })
        .eq("id", referralReward.id);

      // Create notifications
      await supabaseClient
        .from("notifications")
        .insert([
          {
            user_id: referralCodeData.user_id,
            title: "Referral Reward Earned!",
            message: `You earned ${REFERRER_REWARD_POINTS} reward points for referring a friend!`,
            type: "success",
            action_url: "/student/dashboard"
          },
          {
            user_id: user.id,
            title: "Referral Bonus Received!",
            message: `You received ${REFEREE_REWARD_POINTS} reward points for using a referral code!`,
            type: "success",
            action_url: "/student/dashboard"
          }
        ]);

      logStep("Referral completed with rewards", { 
        referrer_points: REFERRER_REWARD_POINTS, 
        referee_points: REFEREE_REWARD_POINTS 
      });
    } else {
      // Just record the referral, rewards will be given on first booking
      await supabaseClient
        .from("referral_codes")
        .update({
          total_referrals: referralCodeData.total_referrals + 1,
          updated_at: new Date().toISOString()
        })
        .eq("id", referralCodeData.id);

      logStep("Referral recorded, pending first booking");
    }

    return new Response(JSON.stringify({ 
      success: true, 
      referral_id: referralReward.id,
      status: booking_id ? 'completed' : 'pending',
      message: booking_id ? 'Referral rewards granted!' : 'Referral recorded! Rewards will be granted on your first booking.'
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in process-referral", { message: errorMessage });
    return new Response(JSON.stringify({ success: false, error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});