import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface MerchantData {
  id: string;
  full_name: string | null;
  email: string;
  phone: string | null;
  merchant_number: number | null;
  created_at: string;
  updated_at: string;
  merchant_profile?: {
    id: string;
    verification_status: string;
    is_onboarding_complete: boolean;
    onboarding_step: number;
    business_email: string | null;
    phone: string | null;
    business_address: string | null;
  } | null;
  current_subscription?: {
    id: string;
    status: string;
    plan_id: string;
    start_date: string;
    end_date: string | null;
    is_trial: boolean;
    trial_end_date: string | null;
    plan: {
      id: string;
      name: string;
      price: number;
      duration: string;
    };
  } | null;
  study_halls_count: number;
  total_revenue: number;
}

interface MerchantStats {
  totalMerchants: number;
  subscribedMerchants: number;
  trialMerchants: number;
  unsubscribedMerchants: number;
  verifiedMerchants: number;
  pendingVerification: number;
}

export const useAllMerchants = () => {
  const [merchants, setMerchants] = useState<MerchantData[]>([]);
  const [stats, setStats] = useState<MerchantStats>({
    totalMerchants: 0,
    subscribedMerchants: 0,
    trialMerchants: 0,
    unsubscribedMerchants: 0,
    verifiedMerchants: 0,
    pendingVerification: 0,
  });
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchAllMerchants = async () => {
    try {
      setLoading(true);
      
      // Fetch all merchants with their profiles
      const { data: merchantData, error } = await supabase
        .from("profiles")
        .select(`
          id,
          full_name,
          email,
          phone,
          merchant_number,
          created_at,
          updated_at,
          merchant_profile:merchant_profiles(
            id,
            verification_status,
            is_onboarding_complete,
            onboarding_step,
            business_email,
            phone,
            business_address
          )
        `)
        .eq("role", "merchant")
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Fetch current subscriptions separately to avoid left join issues
      const { data: subscriptionsData } = await supabase
        .from("merchant_subscriptions")
        .select(`
          merchant_id,
          id,
          status,
          plan_id,
          start_date,
          end_date,
          is_trial,
          trial_end_date,
          plan:subscription_plans(id, name, price, duration)
        `)
        .eq("status", "active")
        .order("created_at", { ascending: false });

      // Create a map of merchant subscriptions
      const subscriptionsMap = new Map();
      subscriptionsData?.forEach(sub => {
        subscriptionsMap.set(sub.merchant_id, sub);
       });

      // Fetch study halls count and revenue for each merchant
      const merchantsWithDetails = await Promise.all(
        (merchantData || []).map(async (merchant) => {
          // Get study halls count
          const { count: studyHallsCount } = await supabase
            .from("study_halls")
            .select("id", { count: 'exact', head: true })
            .eq("merchant_id", merchant.id)
            .eq("status", "active");

          // Get total revenue from completed transactions
          const { data: revenueData } = await supabase
            .from("transactions")
            .select("amount")
            .eq("status", "completed")
            .in("booking_id", [
              // Get booking IDs for this merchant's study halls
              ...await supabase
                .from("bookings")
                .select("id")
                .in("study_hall_id", [
                  // Get study hall IDs for this merchant
                  ...await supabase
                    .from("study_halls")
                    .select("id")
                    .eq("merchant_id", merchant.id)
                    .then(({ data }) => data?.map(sh => sh.id) || [])
                ])
                .then(({ data }) => data?.map(b => b.id) || [])
            ]);

          const totalRevenue = revenueData?.reduce((sum, t) => sum + t.amount, 0) || 0;

          return {
            ...merchant,
            current_subscription: subscriptionsMap.get(merchant.id) || null,
            study_halls_count: studyHallsCount || 0,
            total_revenue: totalRevenue,
          };
        })
      );

      setMerchants(merchantsWithDetails);

      // Calculate stats
      const totalMerchants = merchantsWithDetails.length;
      const subscribedMerchants = merchantsWithDetails.filter(m => 
        m.current_subscription && m.current_subscription.status === 'active' && !m.current_subscription.is_trial
      ).length;
      const trialMerchants = merchantsWithDetails.filter(m => 
        m.current_subscription && m.current_subscription.is_trial
      ).length;
      const unsubscribedMerchants = merchantsWithDetails.filter(m => 
        !m.current_subscription || m.current_subscription.status !== 'active'
      ).length;
      const verifiedMerchants = merchantsWithDetails.filter(m => 
        m.merchant_profile?.verification_status === 'verified'
      ).length;
      const pendingVerification = merchantsWithDetails.filter(m => 
        m.merchant_profile?.verification_status === 'pending'
      ).length;

      setStats({
        totalMerchants,
        subscribedMerchants,
        trialMerchants,
        unsubscribedMerchants,
        verifiedMerchants,
        pendingVerification,
      });

    } catch (error: any) {
      console.error("Error fetching merchants:", error);
      toast({
        title: "Error",
        description: "Failed to load merchant data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const assignPlanToMerchant = async (
    merchantId: string, 
    planId: string, 
    customDuration?: number,
    notes?: string
  ) => {
    try {
      const { data: plan } = await supabase
        .from("subscription_plans")
        .select("*")
        .eq("id", planId)
        .single();

      if (!plan) throw new Error("Plan not found");

      // Calculate end date based on plan duration or custom duration
      const startDate = new Date();
      let endDate = new Date();
      
      if (customDuration) {
        endDate.setDate(startDate.getDate() + customDuration);
      } else {
        if (plan.duration === 'monthly') {
          endDate.setMonth(startDate.getMonth() + 1);
        } else if (plan.duration === 'yearly') {
          endDate.setFullYear(startDate.getFullYear() + 1);
        }
      }

      // Check if merchant already has an active subscription
      const { data: existingSubscription } = await supabase
        .from("merchant_subscriptions")
        .select("*")
        .eq("merchant_id", merchantId)
        .eq("status", "active")
        .single();

      if (existingSubscription) {
        // Update existing subscription
        const { error } = await supabase
          .from("merchant_subscriptions")
          .update({
            plan_id: planId,
            end_date: endDate.toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq("id", existingSubscription.id);

        if (error) throw error;
      } else {
        // Create new subscription
        const { error } = await supabase
          .from("merchant_subscriptions")
          .insert({
            merchant_id: merchantId,
            plan_id: planId,
            status: "active",
            start_date: startDate.toISOString(),
            end_date: endDate.toISOString(),
            payment_method: "admin_assigned",
            auto_renew: false,
            is_trial: false,
          });

        if (error) throw error;
      }

      toast({
        title: "Success",
        description: "Plan assigned successfully",
      });

      // Refresh merchant data
      await fetchAllMerchants();
    } catch (error: any) {
      console.error("Error assigning plan:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to assign plan",
        variant: "destructive",
      });
      throw error;
    }
  };

  const updateMerchantStatus = async (merchantId: string, status: string) => {
    try {
      const { error } = await supabase
        .from("merchant_subscriptions")
        .update({ status })
        .eq("merchant_id", merchantId)
        .eq("status", "active");

      if (error) throw error;

      toast({
        title: "Success",
        description: `Merchant subscription ${status}`,
      });

      await fetchAllMerchants();
    } catch (error: any) {
      console.error("Error updating merchant status:", error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchAllMerchants();
  }, []);

  return {
    merchants,
    stats,
    loading,
    fetchAllMerchants,
    assignPlanToMerchant,
    updateMerchantStatus,
  };
};