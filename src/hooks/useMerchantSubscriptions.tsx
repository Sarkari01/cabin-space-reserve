import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { useToast } from "./use-toast";

export interface MerchantSubscription {
  id: string;
  merchant_id: string;
  plan_id: string;
  status: string;
  start_date: string;
  end_date: string | null;
  auto_renew: boolean;
  payment_method: string;
  last_payment_date: string | null;
  next_payment_date: string | null;
  is_trial?: boolean;
  trial_start_date?: string | null;
  trial_end_date?: string | null;
  max_study_halls?: number | null;
  created_at: string;
  updated_at: string;
  plan: {
    id: string;
    name: string;
    price: number;
    duration: string;
    features: any;
    max_study_halls: number | null;
    max_bookings_per_month: number | null;
    analytics_access: boolean;
    priority_support: boolean;
  };
}

export const useMerchantSubscriptions = () => {
  const [subscription, setSubscription] = useState<MerchantSubscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchSubscription = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("merchant_subscriptions")
        .select(`
          *,
          plan:subscription_plans(*)
        `)
        .eq("merchant_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1);

      if (error) {
        throw error;
      }

      // Set the subscription (could be active, cancelled, or null)
      setSubscription(data && data.length > 0 ? data[0] : null);
      setError(null);
    } catch (err: any) {
      console.error("Error fetching merchant subscription:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const createSubscription = async (planId: string, paymentMethod: string = "razorpay") => {
    if (!user) throw new Error("User not authenticated");

    try {
      // Get plan details for payment
      const { data: plan, error: planError } = await supabase
        .from("subscription_plans")
        .select("*")
        .eq("id", planId)
        .maybeSingle();

      if (planError || !plan) {
        throw new Error("Plan not found");
      }

      // Only Razorpay payment is supported for subscriptions
      if (paymentMethod !== "razorpay") {
        throw new Error("Only Razorpay payment method is supported for subscriptions");
      }
        // Create Razorpay order for subscription
        const { data: orderData, error: orderError } = await supabase.functions.invoke('subscription-payment', {
          body: {
            action: 'create_subscription_order',
            plan_id: planId,
            merchant_id: user.id,
            amount: plan.price
          }
        });

        if (orderError || !orderData.success) {
          console.error('Payment order creation failed:', orderError, orderData);
          throw new Error(orderData?.error || orderError?.message || "Failed to create payment order");
        }

        // Open Razorpay checkout
        const options = {
          key: orderData.key_id,
          amount: orderData.amount,
          currency: orderData.currency,
          name: "StudyHall Subscription",
          description: `${plan.name} Plan Subscription`,
          order_id: orderData.order_id,
          handler: async function (response: any) {
            try {
              // Verify payment
              const { data: verifyData, error: verifyError } = await supabase.functions.invoke('subscription-payment', {
                body: {
                  action: 'verify_subscription_payment',
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_signature: response.razorpay_signature,
                  subscription_transaction_id: orderData.transaction_id
                }
              });

              if (verifyError || !verifyData.success) {
                throw new Error("Payment verification failed");
              }

              toast({
                title: "Payment Successful",
                description: "Your subscription has been activated successfully.",
              });

              // Refresh subscription data
              await fetchSubscription();
            } catch (error) {
              console.error("Payment verification error:", error);
              toast({
                title: "Payment Error",
                description: "Payment verification failed. Please contact support.",
                variant: "destructive",
              });
            }
          },
          prefill: {
            email: user.email,
          },
          theme: {
            color: "#3B82F6"
          }
        };

        // Open Razorpay checkout in new tab
        const rzp = new (window as any).Razorpay(options);
        rzp.open();
        
        return null; // Payment flow will handle subscription creation
    } catch (err: any) {
      console.error("Error creating subscription:", err);
      toast({
        title: "Subscription Error",
        description: err.message || "Failed to create subscription. Please try again or contact support.",
        variant: "destructive",
      });
      throw err;
    }
  };

  const updateSubscription = async (updates: Partial<MerchantSubscription>) => {
    if (!subscription) throw new Error("No subscription found");

    try {
      const { data, error } = await supabase
        .from("merchant_subscriptions")
        .update(updates)
        .eq("id", subscription.id)
        .select(`
          *,
          plan:subscription_plans(*)
        `)
        .maybeSingle();

      if (error) throw error;

      setSubscription(data);
      toast({
        title: "Subscription Updated",
        description: "Your subscription has been updated successfully.",
      });

      return data;
    } catch (err: any) {
      console.error("Error updating subscription:", err);
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive",
      });
      throw err;
    }
  };

  const cancelSubscription = async () => {
    if (!subscription) throw new Error("No subscription found");

    try {
      const { data, error } = await supabase
        .from("merchant_subscriptions")
        .update({ status: "cancelled", auto_renew: false })
        .eq("id", subscription.id)
        .select(`
          *,
          plan:subscription_plans(*)
        `)
        .maybeSingle();

      if (error) throw error;

      setSubscription(data);
      toast({
        title: "Subscription Cancelled",
        description: "Your subscription has been cancelled.",
      });

      return data;
    } catch (err: any) {
      console.error("Error cancelling subscription:", err);
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive",
      });
      throw err;
    }
  };

  useEffect(() => {
    fetchSubscription();
  }, [user]);

  // Set up real-time subscription
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel("merchant-subscription-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "merchant_subscriptions",
          filter: `merchant_id=eq.${user.id}`,
        },
        (payload) => {
          console.log("Subscription change detected:", payload);
          fetchSubscription();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  return {
    subscription,
    loading,
    error,
    createSubscription,
    updateSubscription,
    cancelSubscription,
    refreshSubscription: fetchSubscription,
  };
};