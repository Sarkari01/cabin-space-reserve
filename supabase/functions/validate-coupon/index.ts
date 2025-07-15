import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ValidateCouponRequest {
  coupon_code: string;
  booking_amount: number;
  study_hall_id?: string;
}

interface CouponValidationResponse {
  valid: boolean;
  coupon?: any;
  discount_amount?: number;
  error?: string;
}

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[VALIDATE-COUPON] ${step}${detailsStr}`);
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

    const { coupon_code, booking_amount, study_hall_id }: ValidateCouponRequest = await req.json();
    logStep("Request data", { coupon_code, booking_amount, study_hall_id });

    // Fetch coupon details
    const { data: coupon, error: couponError } = await supabaseClient
      .from("coupons")
      .select("*")
      .eq("code", coupon_code.toUpperCase())
      .eq("status", "active")
      .single();

    if (couponError || !coupon) {
      logStep("Coupon not found", { coupon_code });
      return new Response(
        JSON.stringify({ valid: false, error: "Invalid or expired coupon code" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    logStep("Coupon found", { coupon });

    // Check expiry date
    if (coupon.end_date && new Date(coupon.end_date) < new Date()) {
      logStep("Coupon expired", { end_date: coupon.end_date });
      return new Response(
        JSON.stringify({ valid: false, error: "Coupon has expired" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    // Check usage limits
    if (coupon.usage_limit && coupon.usage_count >= coupon.usage_limit) {
      logStep("Coupon usage limit reached", { usage_count: coupon.usage_count, usage_limit: coupon.usage_limit });
      return new Response(
        JSON.stringify({ valid: false, error: "Coupon usage limit reached" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    // Check user usage limit
    const { data: userUsage } = await supabaseClient
      .from("coupon_usage")
      .select("id")
      .eq("coupon_id", coupon.id)
      .eq("user_id", user.id);

    if (userUsage && userUsage.length >= (coupon.user_usage_limit || 1)) {
      logStep("User usage limit reached", { user_usage: userUsage.length, user_usage_limit: coupon.user_usage_limit });
      return new Response(
        JSON.stringify({ valid: false, error: "You have already used this coupon" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    // Check minimum booking amount
    if (coupon.min_booking_amount && booking_amount < coupon.min_booking_amount) {
      logStep("Minimum booking amount not met", { booking_amount, min_booking_amount: coupon.min_booking_amount });
      return new Response(
        JSON.stringify({ valid: false, error: `Minimum booking amount is ₹${coupon.min_booking_amount}` }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    // Check merchant restriction
    if (coupon.merchant_id && study_hall_id) {
      const { data: studyHall } = await supabaseClient
        .from("study_halls")
        .select("merchant_id")
        .eq("id", study_hall_id)
        .single();

      if (studyHall && studyHall.merchant_id !== coupon.merchant_id) {
        logStep("Merchant restriction violated", { study_hall_merchant: studyHall.merchant_id, coupon_merchant: coupon.merchant_id });
        return new Response(
          JSON.stringify({ valid: false, error: "This coupon is not valid for this study hall" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
        );
      }
    }

    // Check target audience
    if (coupon.target_audience === 'new_users') {
      const { data: bookingHistory } = await supabaseClient
        .from("bookings")
        .select("id")
        .eq("user_id", user.id)
        .eq("payment_status", "paid")
        .limit(1);

      if (bookingHistory && bookingHistory.length > 0) {
        logStep("New users only coupon used by existing user", { bookingHistory: bookingHistory.length });
        return new Response(
          JSON.stringify({ valid: false, error: "This coupon is only for new users" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
        );
      }
    }

    // Calculate discount amount
    let discount_amount = 0;
    if (coupon.type === 'flat') {
      discount_amount = Math.min(coupon.value, booking_amount);
    } else if (coupon.type === 'percentage') {
      discount_amount = Math.min(
        (booking_amount * coupon.value) / 100,
        coupon.max_discount || booking_amount
      );
    }

    logStep("Coupon validation successful", { discount_amount });

    const response: CouponValidationResponse = {
      valid: true,
      coupon,
      discount_amount
    };

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in validate-coupon", { message: errorMessage });
    return new Response(JSON.stringify({ valid: false, error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});