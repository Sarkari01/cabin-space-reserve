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

  const createSubscription = async (planId: string, paymentMethod: string = "offline") => {
    if (!user) throw new Error("User not authenticated");

    try {
      const startDate = new Date().toISOString();
      const endDate = new Date();
      endDate.setMonth(endDate.getMonth() + 1); // Default to 1 month

      // Check if merchant already has a subscription record
      const { data: existingSubscription } = await supabase
        .from("merchant_subscriptions")
        .select("id")
        .eq("merchant_id", user.id)
        .single();

      let data, error;

      if (existingSubscription) {
        // Update existing subscription record
        const result = await supabase
          .from("merchant_subscriptions")
          .update({
            plan_id: planId,
            status: "active",
            start_date: startDate,
            end_date: endDate.toISOString(),
            payment_method: paymentMethod,
            auto_renew: true,
          })
          .eq("id", existingSubscription.id)
          .select(`
            *,
            plan:subscription_plans(*)
          `)
          .single();
        
        data = result.data;
        error = result.error;
      } else {
        // Create new subscription record
        const result = await supabase
          .from("merchant_subscriptions")
          .insert({
            merchant_id: user.id,
            plan_id: planId,
            status: "active",
            start_date: startDate,
            end_date: endDate.toISOString(),
            payment_method: paymentMethod,
            auto_renew: true,
          })
          .select(`
            *,
            plan:subscription_plans(*)
          `)
          .single();
        
        data = result.data;
        error = result.error;
      }

      if (error) throw error;

      setSubscription(data);
      toast({
        title: "Subscription Activated",
        description: "Your subscription has been activated successfully.",
      });

      return data;
    } catch (err: any) {
      console.error("Error creating subscription:", err);
      toast({
        title: "Error",
        description: err.message,
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
        .single();

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
        .single();

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