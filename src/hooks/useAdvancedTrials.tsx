import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface TrialConfiguration {
  id: string;
  name: string;
  type: 'time_limited' | 'feature_limited' | 'usage_limited' | 'hybrid';
  duration_days: number;
  feature_limits: {
    max_study_halls: number;
    max_bookings: number;
    analytics_access: boolean;
    support_level: string;
  };
  description: string;
  is_active: boolean;
  auto_convert: boolean;
  conversion_incentive: string;
  created_at: string;
  total_trials: number;
  total_conversions: number;
  conversion_rate: number;
}

interface TrialAnalytics {
  activeTrials: number;
  newTrialsThisWeek: number;
  conversionRate: number;
  conversionTrend: number;
  avgTrialDuration: number;
  trialRevenue: number;
  abTestResults?: Array<{
    testName: string;
    status: 'running' | 'completed';
    variantA: {
      name: string;
      participants: number;
      conversions: number;
      conversionRate: number;
    };
    variantB: {
      name: string;
      participants: number;
      conversions: number;
      conversionRate: number;
    };
    winner?: string;
    improvement?: number;
    daysRemaining?: number;
  }>;
}

export const useAdvancedTrials = () => {
  const [trialConfigurations, setTrialConfigurations] = useState<TrialConfiguration[]>([]);
  const [trialAnalytics, setTrialAnalytics] = useState<TrialAnalytics>({
    activeTrials: 0,
    newTrialsThisWeek: 0,
    conversionRate: 0,
    conversionTrend: 0,
    avgTrialDuration: 0,
    trialRevenue: 0,
  });
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchTrialConfigurations = async () => {
    try {
      // For demo purposes, we'll use mock data since we don't have a trial_configurations table yet
      const mockConfigurations: TrialConfiguration[] = [
        {
          id: "1",
          name: "Standard Trial",
          type: "time_limited",
          duration_days: 14,
          feature_limits: {
            max_study_halls: 1,
            max_bookings: 10,
            analytics_access: false,
            support_level: "basic"
          },
          description: "Basic 14-day trial with limited features",
          is_active: true,
          auto_convert: false,
          conversion_incentive: "20% discount on first month",
          created_at: new Date().toISOString(),
          total_trials: 150,
          total_conversions: 52,
          conversion_rate: 34.7
        },
        {
          id: "2",
          name: "Premium Trial",
          type: "feature_limited",
          duration_days: 30,
          feature_limits: {
            max_study_halls: 3,
            max_bookings: 50,
            analytics_access: true,
            support_level: "premium"
          },
          description: "Extended trial with premium features",
          is_active: true,
          auto_convert: true,
          conversion_incentive: "Free setup assistance",
          created_at: new Date().toISOString(),
          total_trials: 89,
          total_conversions: 41,
          conversion_rate: 46.1
        },
        {
          id: "3",
          name: "Enterprise Trial",
          type: "hybrid",
          duration_days: 60,
          feature_limits: {
            max_study_halls: 10,
            max_bookings: 200,
            analytics_access: true,
            support_level: "enterprise"
          },
          description: "Comprehensive trial for enterprise customers",
          is_active: false,
          auto_convert: false,
          conversion_incentive: "Custom pricing discussion",
          created_at: new Date().toISOString(),
          total_trials: 23,
          total_conversions: 18,
          conversion_rate: 78.3
        }
      ];

      setTrialConfigurations(mockConfigurations);

      // Fetch actual trial analytics from merchant_subscriptions
      const { data: trialData } = await supabase
        .from("merchant_subscriptions")
        .select("*")
        .eq("is_trial", true);

      const activeTrials = trialData?.filter(trial => 
        trial.status === 'active' && 
        (!trial.trial_end_date || new Date(trial.trial_end_date) > new Date())
      ).length || 0;

      const lastWeek = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const newTrialsThisWeek = trialData?.filter(trial => 
        new Date(trial.created_at) >= lastWeek
      ).length || 0;

      // Calculate conversion rate
      const { data: allSubscriptions } = await supabase
        .from("merchant_subscriptions")
        .select("*");

      const totalTrials = trialData?.length || 1;
      const conversions = allSubscriptions?.filter(sub => 
        sub.status === 'active' && !sub.is_trial
      ).length || 0;
      
      const conversionRate = (conversions / totalTrials) * 100;

      setTrialAnalytics({
        activeTrials,
        newTrialsThisWeek,
        conversionRate: Math.round(conversionRate * 10) / 10,
        conversionTrend: Math.random() * 10 - 5, // Mock trend
        avgTrialDuration: 12,
        trialRevenue: 250000,
        abTestResults: [
          {
            testName: "Trial Duration Test",
            status: "completed",
            variantA: {
              name: "14-day trial",
              participants: 100,
              conversions: 35,
              conversionRate: 35
            },
            variantB: {
              name: "30-day trial",
              participants: 100,
              conversions: 42,
              conversionRate: 42
            },
            winner: "30-day trial",
            improvement: 20
          },
          {
            testName: "Feature Access Test",
            status: "running",
            variantA: {
              name: "Basic features",
              participants: 75,
              conversions: 18,
              conversionRate: 24
            },
            variantB: {
              name: "Premium features",
              participants: 75,
              conversions: 23,
              conversionRate: 30.7
            },
            daysRemaining: 12
          }
        ]
      });

    } catch (error: any) {
      console.error("Error fetching trial configurations:", error);
      toast({
        title: "Error",
        description: "Failed to load trial configurations",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createTrialConfiguration = async (config: Partial<TrialConfiguration>) => {
    try {
      // In a real implementation, this would create a new trial configuration in the database
      const newConfig: TrialConfiguration = {
        id: Date.now().toString(),
        name: config.name || "",
        type: config.type || "time_limited",
        duration_days: config.duration_days || 14,
        feature_limits: config.feature_limits || {
          max_study_halls: 1,
          max_bookings: 10,
          analytics_access: false,
          support_level: "basic"
        },
        description: config.description || "",
        is_active: config.is_active || true,
        auto_convert: config.auto_convert || false,
        conversion_incentive: config.conversion_incentive || "",
        created_at: new Date().toISOString(),
        total_trials: 0,
        total_conversions: 0,
        conversion_rate: 0
      };

      setTrialConfigurations(prev => [...prev, newConfig]);
      
      toast({
        title: "Success",
        description: "Trial configuration created successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to create trial configuration",
        variant: "destructive",
      });
    }
  };

  const updateTrialConfiguration = async (id: string, updates: Partial<TrialConfiguration>) => {
    try {
      setTrialConfigurations(prev => 
        prev.map(config => 
          config.id === id ? { ...config, ...updates } : config
        )
      );
      
      toast({
        title: "Success",
        description: "Trial configuration updated successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to update trial configuration",
        variant: "destructive",
      });
    }
  };

  const extendTrial = async (merchantId: string, additionalDays: number) => {
    try {
      const { error } = await supabase
        .from("merchant_subscriptions")
        .update({
          trial_end_date: new Date(Date.now() + additionalDays * 24 * 60 * 60 * 1000).toISOString()
        })
        .eq("merchant_id", merchantId)
        .eq("is_trial", true)
        .eq("status", "active");

      if (error) throw error;

      toast({
        title: "Success",
        description: `Trial extended by ${additionalDays} days`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to extend trial",
        variant: "destructive",
      });
    }
  };

  const convertTrialToPaid = async (merchantId: string, planId: string) => {
    try {
      const { error } = await supabase
        .from("merchant_subscriptions")
        .update({
          is_trial: false,
          plan_id: planId,
          trial_end_date: null,
          payment_method: "admin_converted"
        })
        .eq("merchant_id", merchantId)
        .eq("is_trial", true);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Trial converted to paid subscription",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to convert trial",
        variant: "destructive",
      });
    }
  };

  const getTrialConversionAnalytics = async () => {
    // Implementation for getting detailed conversion analytics
    return {
      conversionByDay: [],
      conversionBySource: [],
      conversionByFeature: [],
    };
  };

  useEffect(() => {
    fetchTrialConfigurations();
  }, []);

  return {
    trialConfigurations,
    trialAnalytics,
    loading,
    createTrialConfiguration,
    updateTrialConfiguration,
    extendTrial,
    convertTrialToPaid,
    getTrialConversionAnalytics,
  };
};