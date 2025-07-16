import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "./use-toast";
import { useAuth } from "./useAuth";

export interface TrialPlanSettings {
  enabled: boolean;
  duration_days: number;
  plan_name: string;
  max_study_halls: number;
}

export const useTrialPlan = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [trialSettings, setTrialSettings] = useState<TrialPlanSettings | null>(null);
  const [hasUsedTrial, setHasUsedTrial] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activating, setActivating] = useState(false);

  const fetchTrialSettings = async () => {
    try {
      const { data, error } = await supabase.rpc('get_trial_plan_settings');
      if (error) throw error;
      
      if (data && data.length > 0) {
        setTrialSettings(data[0]);
      }
    } catch (error) {
      console.error("Error fetching trial settings:", error);
    }
  };

  const checkTrialUsage = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase.rpc('has_merchant_used_trial', {
        p_merchant_id: user.id
      });
      if (error) throw error;
      
      setHasUsedTrial(data || false);
    } catch (error) {
      console.error("Error checking trial usage:", error);
      setHasUsedTrial(false);
    }
  };

  const activateTrialPlan = async () => {
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to activate a trial",
        variant: "destructive",
      });
      return false;
    }

    if (hasUsedTrial) {
      toast({
        title: "Trial Already Used",
        description: "You have already used your free trial. Please choose a paid plan.",
        variant: "destructive",
      });
      return false;
    }

    setActivating(true);
    try {
      const { data, error } = await supabase.rpc('activate_trial_subscription', {
        p_merchant_id: user.id
      });

      if (error) throw error;

      const result = data as { success: boolean; error?: string; subscription_id?: string; trial_end_date?: string };
      
      if (result.success) {
        toast({
          title: "Trial Activated!",
          description: `Your ${trialSettings?.plan_name || 'Free Trial'} has been activated successfully.`,
        });
        
        // Refresh trial usage status
        await checkTrialUsage();
        return true;
      } else {
        toast({
          title: "Activation Failed",
          description: result.error || "Failed to activate trial plan",
          variant: "destructive",
        });
        return false;
      }
    } catch (error) {
      console.error("Error activating trial:", error);
      toast({
        title: "Error",
        description: "Failed to activate trial plan",
        variant: "destructive",
      });
      return false;
    } finally {
      setActivating(false);
    }
  };

  const isTrialEligible = () => {
    return trialSettings?.enabled && !hasUsedTrial;
  };

  useEffect(() => {
    const initializeTrialData = async () => {
      setLoading(true);
      await Promise.all([
        fetchTrialSettings(),
        checkTrialUsage()
      ]);
      setLoading(false);
    };

    initializeTrialData();
  }, [user]);

  return {
    trialSettings,
    hasUsedTrial,
    loading,
    activating,
    isTrialEligible: isTrialEligible(),
    activateTrialPlan,
    refreshTrialStatus: checkTrialUsage,
  };
};