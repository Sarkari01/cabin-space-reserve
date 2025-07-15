import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

export interface ReferralCode {
  id: string;
  user_id: string;
  code: string;
  total_referrals: number;
  successful_referrals: number;
  total_earnings: number;
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
}

export interface ReferralReward {
  id: string;
  referrer_id: string;
  referee_id: string;
  referral_code_id: string;
  booking_id?: string;
  referrer_reward_points: number;
  referee_reward_points: number;
  referrer_coupon_id?: string;
  referee_coupon_id?: string;
  status: 'pending' | 'completed' | 'cancelled';
  completed_at?: string;
  created_at: string;
}

export const useReferrals = (forceRole?: "student" | "merchant" | "admin") => {
  const [referralCode, setReferralCode] = useState<ReferralCode | null>(null);
  const [referralRewards, setReferralRewards] = useState<ReferralReward[]>([]);
  const [allReferralCodes, setAllReferralCodes] = useState<ReferralCode[]>([]);
  const [loading, setLoading] = useState(true);
  const { user, userRole } = useAuth();
  const { toast } = useToast();

  const effectiveRole = forceRole || userRole;

  const fetchReferralCode = async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Fetch user's referral code
      const { data: codeData, error: codeError } = await supabase
        .from('referral_codes')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (codeError && codeError.code !== 'PGRST116') {
        console.error('Error fetching referral code:', codeError);
        return;
      }

      setReferralCode(codeData as ReferralCode);
    } catch (error) {
      console.error('Error in fetchReferralCode:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchReferralRewards = async () => {
    if (!user) return;

    try {
      let query = supabase.from('referral_rewards').select('*');

      // Apply role-based filtering
      if (effectiveRole === 'student') {
        query = query.or(`referrer_id.eq.${user.id},referee_id.eq.${user.id}`);
      }
      // Admin sees all referral rewards

      query = query.order('created_at', { ascending: false });

      const { data: rewardsData, error: rewardsError } = await query;

      if (rewardsError) {
        console.error('Error fetching referral rewards:', rewardsError);
        return;
      }

      setReferralRewards((rewardsData as ReferralReward[]) || []);
    } catch (error) {
      console.error('Error in fetchReferralRewards:', error);
    }
  };

  const fetchAllReferralCodes = async () => {
    if (!user || effectiveRole !== 'admin') return;

    try {
      const { data: codesData, error: codesError } = await supabase
        .from('referral_codes')
        .select('*')
        .order('total_earnings', { ascending: false });

      if (codesError) {
        console.error('Error fetching all referral codes:', codesError);
        return;
      }

      setAllReferralCodes((codesData as ReferralCode[]) || []);
    } catch (error) {
      console.error('Error in fetchAllReferralCodes:', error);
    }
  };

  const processReferral = async (referralCode: string, bookingId?: string) => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to use referral codes.",
        variant: "destructive",
      });
      return false;
    }

    try {
      const { data, error } = await supabase.functions.invoke('process-referral', {
        body: {
          referral_code: referralCode,
          booking_id: bookingId
        }
      });

      if (error) {
        throw new Error(error.message);
      }

      if (!data.success) {
        toast({
          title: "Referral failed",
          description: data.error,
          variant: "destructive",
        });
        return false;
      }

      toast({
        title: "Referral processed!",
        description: data.message,
        variant: "default",
      });

      // Refresh data
      await fetchReferralCode();
      await fetchReferralRewards();
      
      return {
        success: true,
        referral_id: data.referral_id,
        status: data.status
      };
    } catch (error) {
      console.error('Error processing referral:', error);
      toast({
        title: "Referral failed",
        description: error instanceof Error ? error.message : "Failed to process referral",
        variant: "destructive",
      });
      return false;
    }
  };

  const updateReferralCodeStatus = async (codeId: string, status: 'active' | 'inactive') => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('referral_codes')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', codeId);

      if (error) {
        console.error('Error updating referral code status:', error);
        toast({
          title: "Update failed",
          description: error.message,
          variant: "destructive",
        });
        return false;
      }

      toast({
        title: "Status updated!",
        description: `Referral code ${status === 'active' ? 'activated' : 'deactivated'} successfully.`,
        variant: "default",
      });

      await fetchReferralCode();
      return true;
    } catch (error) {
      console.error('Error updating referral code status:', error);
      toast({
        title: "Update failed",
        description: error instanceof Error ? error.message : "Failed to update status",
        variant: "destructive",
      });
      return false;
    }
  };

  const shareReferralCode = async (method: 'copy' | 'whatsapp' | 'email') => {
    if (!referralCode) return;

    const shareText = `Join me on StudyHall and get bonus rewards! Use my referral code: ${referralCode.code}`;
    const shareUrl = `${window.location.origin}/auth/register?ref=${referralCode.code}`;

    try {
      switch (method) {
        case 'copy':
          await navigator.clipboard.writeText(`${shareText}\n${shareUrl}`);
          toast({
            title: "Copied to clipboard!",
            description: "Referral code and link copied successfully.",
            variant: "default",
          });
          break;

        case 'whatsapp':
          const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(`${shareText}\n${shareUrl}`)}`;
          window.open(whatsappUrl, '_blank');
          break;

        case 'email':
          const emailUrl = `mailto:?subject=${encodeURIComponent('Join StudyHall with my referral!')}&body=${encodeURIComponent(`${shareText}\n\nClick here to sign up: ${shareUrl}`)}`;
          window.open(emailUrl, '_blank');
          break;
      }
    } catch (error) {
      console.error('Error sharing referral code:', error);
      toast({
        title: "Share failed",
        description: "Failed to share referral code.",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchReferralCode();
    fetchReferralRewards();
    if (effectiveRole === 'admin') {
      fetchAllReferralCodes();
    }

    // Set up real-time subscription for referrals
    if (user) {
      const referralsChannel = supabase
        .channel('referrals-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'referral_codes',
            filter: effectiveRole === 'student' ? `user_id=eq.${user.id}` : undefined
          },
          () => {
            fetchReferralCode();
            if (effectiveRole === 'admin') {
              fetchAllReferralCodes();
            }
          }
        )
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'referral_rewards',
            filter: effectiveRole === 'student' ? `or(referrer_id.eq.${user.id},referee_id.eq.${user.id})` : undefined
          },
          () => {
            fetchReferralRewards();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(referralsChannel);
      };
    }
  }, [user, effectiveRole]);

  const referralStats = referralCode ? {
    total_referrals: referralCode.total_referrals,
    successful_referrals: referralCode.successful_referrals,
    total_earnings: referralCode.total_earnings
  } : {
    total_referrals: 0,
    successful_referrals: 0,
    total_earnings: 0
  };

  return {
    referralCode,
    referralRewards,
    allReferralCodes,
    referralStats,
    loading,
    fetchReferralCode,
    fetchReferralRewards,
    fetchAllReferralCodes,
    processReferral,
    updateReferralCodeStatus,
    shareReferralCode
  };
};