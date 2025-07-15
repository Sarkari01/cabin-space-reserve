import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

export interface Coupon {
  id: string;
  code: string;
  title: string;
  description?: string;
  type: 'flat' | 'percentage';
  value: number;
  min_booking_amount: number;
  max_discount?: number;
  merchant_id?: string;
  target_audience: 'all' | 'new_users' | 'returning_users';
  usage_limit?: number;
  usage_count: number;
  user_usage_limit: number;
  start_date: string;
  end_date?: string;
  status: 'active' | 'inactive' | 'expired';
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface CouponUsage {
  id: string;
  coupon_id: string;
  user_id: string;
  booking_id?: string;
  discount_amount: number;
  used_at: string;
  coupon?: Coupon;
}

export const useCoupons = (forceRole?: "student" | "merchant" | "admin") => {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [couponUsage, setCouponUsage] = useState<CouponUsage[]>([]);
  const [loading, setLoading] = useState(true);
  const { user, userRole } = useAuth();
  const { toast } = useToast();

  const effectiveRole = forceRole || userRole;

  const fetchCoupons = async () => {
    if (!user) return;

    try {
      setLoading(true);

      let query = supabase.from('coupons').select('*');

      // Apply role-based filtering
      if (effectiveRole === 'merchant') {
        query = query.or(`merchant_id.eq.${user.id},merchant_id.is.null`);
      } else if (effectiveRole === 'student') {
        query = query
          .eq('status', 'active')
          .or('end_date.is.null,end_date.gte.now()');
      }
      // Admin sees all coupons

      query = query.order('created_at', { ascending: false });

      const { data: couponsData, error: couponsError } = await query;

      if (couponsError) {
        console.error('Error fetching coupons:', couponsError);
        return;
      }

      setCoupons((couponsData as Coupon[]) || []);
    } catch (error) {
      console.error('Error in fetchCoupons:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCouponUsage = async () => {
    if (!user) return;

    try {
      let query = supabase
        .from('coupon_usage')
        .select(`
          *,
          coupon:coupons(*)
        `);

      // Apply role-based filtering
      if (effectiveRole === 'student') {
        query = query.eq('user_id', user.id);
      } else if (effectiveRole === 'merchant') {
        // Merchant can see usage for their study halls - get booking IDs first
        const { data: merchantBookings } = await supabase
          .from('bookings')
          .select('id')
          .in('study_hall_id', 
            (await supabase
              .from('study_halls')
              .select('id')
              .eq('merchant_id', user.id)
            ).data?.map(sh => sh.id) || []
          );
        
        if (merchantBookings && merchantBookings.length > 0) {
          query = query.in('booking_id', merchantBookings.map(b => b.id));
        } else {
          // No bookings found, return empty array
          setCouponUsage([]);
          return;
        }
      }
      // Admin sees all usage

      query = query.order('used_at', { ascending: false });

      const { data: usageData, error: usageError } = await query;

      if (usageError) {
        console.error('Error fetching coupon usage:', usageError);
        return;
      }

      setCouponUsage((usageData as CouponUsage[]) || []);
    } catch (error) {
      console.error('Error in fetchCouponUsage:', error);
    }
  };

  const validateCoupon = async (couponCode: string, bookingAmount: number, studyHallId?: string) => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to validate coupons.",
        variant: "destructive",
      });
      return null;
    }

    try {
      const { data, error } = await supabase.functions.invoke('validate-coupon', {
        body: {
          coupon_code: couponCode,
          booking_amount: bookingAmount,
          study_hall_id: studyHallId
        }
      });

      if (error) {
        throw new Error(error.message);
      }

      if (!data.valid) {
        toast({
          title: "Invalid coupon",
          description: data.error,
          variant: "destructive",
        });
        return null;
      }

      return {
        valid: true,
        coupon: data.coupon,
        discount_amount: data.discount_amount
      };
    } catch (error) {
      console.error('Error validating coupon:', error);
      toast({
        title: "Validation failed",
        description: error instanceof Error ? error.message : "Failed to validate coupon",
        variant: "destructive",
      });
      return null;
    }
  };

  const createCoupon = async (couponData: Partial<Coupon>) => {
    if (!user || effectiveRole !== 'admin') {
      toast({
        title: "Access denied",
        description: "Only admins can create coupons.",
        variant: "destructive",
      });
      return false;
    }

    try {
      const { data, error } = await supabase
        .from('coupons')
        .insert({
          title: couponData.title || '',
          code: couponData.code?.toUpperCase() || '',
          description: couponData.description,
          type: couponData.type || 'flat',
          value: couponData.value || 0,
          min_booking_amount: couponData.min_booking_amount || 0,
          max_discount: couponData.max_discount,
          merchant_id: couponData.merchant_id,
          target_audience: couponData.target_audience || 'all',
          usage_limit: couponData.usage_limit,
          user_usage_limit: couponData.user_usage_limit || 1,
          start_date: couponData.start_date || new Date().toISOString(),
          end_date: couponData.end_date,
          status: couponData.status || 'active',
          created_by: user.id
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating coupon:', error);
        toast({
          title: "Failed to create coupon",
          description: error.message,
          variant: "destructive",
        });
        return false;
      }

      toast({
        title: "Coupon created!",
        description: `Coupon ${data.code} has been created successfully.`,
        variant: "default",
      });

      await fetchCoupons();
      return true;
    } catch (error) {
      console.error('Error creating coupon:', error);
      toast({
        title: "Creation failed",
        description: error instanceof Error ? error.message : "Failed to create coupon",
        variant: "destructive",
      });
      return false;
    }
  };

  const updateCoupon = async (couponId: string, updates: Partial<Coupon>) => {
    if (!user || effectiveRole !== 'admin') {
      toast({
        title: "Access denied",
        description: "Only admins can update coupons.",
        variant: "destructive",
      });
      return false;
    }

    try {
      const { error } = await supabase
        .from('coupons')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', couponId);

      if (error) {
        console.error('Error updating coupon:', error);
        toast({
          title: "Failed to update coupon",
          description: error.message,
          variant: "destructive",
        });
        return false;
      }

      toast({
        title: "Coupon updated!",
        description: "Coupon has been updated successfully.",
        variant: "default",
      });

      await fetchCoupons();
      return true;
    } catch (error) {
      console.error('Error updating coupon:', error);
      toast({
        title: "Update failed",
        description: error instanceof Error ? error.message : "Failed to update coupon",
        variant: "destructive",
      });
      return false;
    }
  };

  const deleteCoupon = async (couponId: string) => {
    if (!user || effectiveRole !== 'admin') {
      toast({
        title: "Access denied",
        description: "Only admins can delete coupons.",
        variant: "destructive",
      });
      return false;
    }

    try {
      const { error } = await supabase
        .from('coupons')
        .delete()
        .eq('id', couponId);

      if (error) {
        console.error('Error deleting coupon:', error);
        toast({
          title: "Failed to delete coupon",
          description: error.message,
          variant: "destructive",
        });
        return false;
      }

      toast({
        title: "Coupon deleted!",
        description: "Coupon has been deleted successfully.",
        variant: "default",
      });

      await fetchCoupons();
      return true;
    } catch (error) {
      console.error('Error deleting coupon:', error);
      toast({
        title: "Deletion failed",
        description: error instanceof Error ? error.message : "Failed to delete coupon",
        variant: "destructive",
      });
      return false;
    }
  };

  useEffect(() => {
    fetchCoupons();
    fetchCouponUsage();

    // Set up real-time subscription for coupons
    if (user) {
      const couponsChannel = supabase
        .channel('coupons-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'coupons'
          },
          () => {
            fetchCoupons();
          }
        )
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'coupon_usage'
          },
          () => {
            fetchCouponUsage();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(couponsChannel);
      };
    }
  }, [user, effectiveRole]);

  return {
    coupons,
    couponUsage,
    loading,
    fetchCoupons,
    fetchCouponUsage,
    validateCoupon,
    createCoupon,
    updateCoupon,
    deleteCoupon
  };
};