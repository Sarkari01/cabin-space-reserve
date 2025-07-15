import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from '@/hooks/use-toast';

export interface SubscriptionLimits {
  maxStudyHalls: number;
  currentStudyHalls: number;
  isTrial: boolean;
  trialExpiresAt: string | null;
  planName: string;
  status: string;
  canCreateStudyHall: boolean;
}

export const useSubscriptionLimits = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [limits, setLimits] = useState<SubscriptionLimits | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLimits = async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .rpc('get_merchant_subscription_limits', {
          p_merchant_id: user.id
        });

      if (fetchError) {
        throw fetchError;
      }

      if (data && data.length > 0) {
        const result = data[0];
        setLimits({
          maxStudyHalls: result.max_study_halls,
          currentStudyHalls: result.current_study_halls,
          isTrial: result.is_trial,
          trialExpiresAt: result.trial_expires_at,
          planName: result.plan_name,
          status: result.status,
          canCreateStudyHall: result.can_create_study_hall
        });
      } else {
        setLimits({
          maxStudyHalls: 1,
          currentStudyHalls: 0,
          isTrial: false,
          trialExpiresAt: null,
          planName: 'No Subscription',
          status: 'inactive',
          canCreateStudyHall: false
        });
      }
    } catch (err: any) {
      console.error('Error fetching subscription limits:', err);
      const errorMessage = err?.message || 'Failed to load subscription limits';
      setError(errorMessage);
      
      // Set fallback limits for graceful degradation
      setLimits({
        maxStudyHalls: 1,
        currentStudyHalls: 0,
        isTrial: false,
        trialExpiresAt: null,
        planName: 'No Subscription',
        status: 'inactive',
        canCreateStudyHall: false
      });
      
      toast({
        title: "Error",
        description: `Failed to load subscription limits: ${errorMessage}`,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const checkStudyHallCreationLimit = (): boolean => {
    if (!limits) return false;

    if (!limits.canCreateStudyHall) {
      let message = '';
      
      if (limits.isTrial && limits.trialExpiresAt) {
        const expiryDate = new Date(limits.trialExpiresAt);
        if (expiryDate < new Date()) {
          message = 'Your trial has expired. Please upgrade to continue creating study halls.';
        } else {
          message = `Trial users are limited to ${limits.maxStudyHalls} study hall${limits.maxStudyHalls === 1 ? '' : 's'}.`;
        }
      } else if (limits.currentStudyHalls >= limits.maxStudyHalls) {
        message = `You've reached your limit of ${limits.maxStudyHalls} study hall${limits.maxStudyHalls === 1 ? '' : 's'}. Upgrade to Premium for unlimited study halls.`;
      } else {
        message = 'Please subscribe to a plan to create study halls.';
      }

      toast({
        title: "Study Hall Limit Reached",
        description: message,
        variant: "destructive"
      });
      
      return false;
    }

    return true;
  };

  const getRemainingStudyHalls = (): number => {
    if (!limits) return 0;
    return Math.max(0, limits.maxStudyHalls - limits.currentStudyHalls);
  };

  const getTrialDaysRemaining = (): number | null => {
    if (!limits || !limits.isTrial || !limits.trialExpiresAt) return null;
    
    const expiryDate = new Date(limits.trialExpiresAt);
    const today = new Date();
    const diffTime = expiryDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return Math.max(0, diffDays);
  };

  const isPremiumPlan = (): boolean => {
    return limits?.planName?.toLowerCase().includes('premium') || false;
  };

  const isBasicPlan = (): boolean => {
    return limits?.planName?.toLowerCase().includes('basic') || false;
  };

  useEffect(() => {
    fetchLimits();
  }, [user?.id]);

  // Set up real-time subscription for updates
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel('subscription-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'merchant_subscriptions',
          filter: `merchant_id=eq.${user.id}`
        },
        () => {
          fetchLimits();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'study_halls',
          filter: `merchant_id=eq.${user.id}`
        },
        () => {
          fetchLimits();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  return {
    limits,
    loading,
    error,
    fetchLimits,
    checkStudyHallCreationLimit,
    getRemainingStudyHalls,
    getTrialDaysRemaining,
    isPremiumPlan,
    isBasicPlan
  };
};