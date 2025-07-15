import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

export interface Reward {
  id: string;
  user_id: string;
  total_points: number;
  available_points: number;
  lifetime_earned: number;
  lifetime_redeemed: number;
  created_at: string;
  updated_at: string;
}

export interface RewardTransaction {
  id: string;
  user_id: string;
  type: 'earned' | 'redeemed' | 'expired';
  points: number;
  reason: string;
  booking_id?: string;
  referral_id?: string;
  created_at: string;
}

export const useRewards = () => {
  const [rewards, setRewards] = useState<Reward | null>(null);
  const [transactions, setTransactions] = useState<RewardTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchRewards = async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Fetch user rewards
      const { data: rewardsData, error: rewardsError } = await supabase
        .from('rewards')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (rewardsError && rewardsError.code !== 'PGRST116') {
        console.error('Error fetching rewards:', rewardsError);
        return;
      }

      setRewards(rewardsData);

      // Fetch reward transactions
      const { data: transactionsData, error: transactionsError } = await supabase
        .from('reward_transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (transactionsError) {
        console.error('Error fetching reward transactions:', transactionsError);
        return;
      }

      setTransactions((transactionsData as RewardTransaction[]) || []);
    } catch (error) {
      console.error('Error in fetchRewards:', error);
    } finally {
      setLoading(false);
    }
  };

  const redeemRewards = async (pointsToRedeem: number, bookingId?: string) => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to redeem rewards.",
        variant: "destructive",
      });
      return false;
    }

    try {
      const { data, error } = await supabase.functions.invoke('redeem-rewards', {
        body: {
          points_to_redeem: pointsToRedeem,
          booking_id: bookingId
        }
      });

      if (error) {
        throw new Error(error.message);
      }

      if (!data.success) {
        toast({
          title: "Redemption failed",
          description: data.error,
          variant: "destructive",
        });
        return false;
      }

      toast({
        title: "Rewards redeemed!",
        description: data.message,
        variant: "default",
      });

      // Refresh rewards data
      await fetchRewards();
      
      return {
        success: true,
        discount_amount: data.discount_amount,
        points_redeemed: data.points_redeemed,
        remaining_points: data.remaining_points
      };
    } catch (error) {
      console.error('Error redeeming rewards:', error);
      toast({
        title: "Redemption failed",
        description: error instanceof Error ? error.message : "Failed to redeem rewards",
        variant: "destructive",
      });
      return false;
    }
  };

  useEffect(() => {
    fetchRewards();

    // Set up real-time subscription for rewards
    if (user) {
      const rewardsChannel = supabase
        .channel('rewards-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'rewards',
            filter: `user_id=eq.${user.id}`
          },
          () => {
            fetchRewards();
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'reward_transactions',
            filter: `user_id=eq.${user.id}`
          },
          () => {
            fetchRewards();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(rewardsChannel);
      };
    }
  }, [user]);

  return {
    rewards,
    transactions,
    loading,
    fetchRewards,
    redeemRewards
  };
};