import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

export interface ReportFilter {
  dateFrom?: string;
  dateTo?: string;
  status?: string;
  merchantId?: string;
  studyHallId?: string;
  paymentMethod?: string;
  planType?: string;
}

export interface ReportData {
  [key: string]: any;
}

export const useReports = () => {
  const { user, userRole } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const fetchBookingsReport = async (filters: ReportFilter = {}) => {
    setLoading(true);
    try {
      let query = supabase
        .from('bookings')
        .select(`
          *,
          profiles!bookings_user_id_fkey(full_name, email),
          study_halls!bookings_study_hall_id_fkey(name, location, merchant_id),
          seats!bookings_seat_id_fkey(seat_id)
        `);

      // Apply role-based filters
      if (userRole === 'merchant') {
        // Filter by study halls owned by merchant
        const { data: merchantStudyHalls } = await supabase
          .from('study_halls')
          .select('id')
          .eq('merchant_id', user?.id);
        
        if (merchantStudyHalls?.length) {
          query = query.in('study_hall_id', merchantStudyHalls.map(sh => sh.id));
        }
      } else if (userRole === 'student') {
        query = query.eq('user_id', user?.id);
      }

      // Apply additional filters
      if (filters.dateFrom) {
        query = query.gte('start_date', filters.dateFrom);
      }
      if (filters.dateTo) {
        query = query.lte('end_date', filters.dateTo);
      }
      if (filters.status && filters.status !== 'all') {
        query = query.eq('status', filters.status);
      }
      if (filters.studyHallId) {
        query = query.eq('study_hall_id', filters.studyHallId);
      }

      const { data, error } = await query.order('created_at', { ascending: false });
      
      if (error) {
        console.error('Bookings query error:', error);
        throw error;
      }

      // Transform data to match expected structure
      const transformedData = data?.map(booking => ({
        ...booking,
        user: booking.profiles,
        study_hall: booking.study_halls,
        seat: booking.seats
      })) || [];

      return transformedData;
    } catch (error) {
      console.error('Error fetching bookings report:', error);
      toast({
        title: "Error",
        description: `Failed to fetch bookings report: ${error.message}`,
        variant: "destructive",
      });
      return [];
    } finally {
      setLoading(false);
    }
  };

  const fetchTransactionsReport = async (filters: ReportFilter = {}) => {
    setLoading(true);
    try {
      let query = supabase
        .from('transactions')
        .select(`
          *,
          bookings!transactions_booking_id_fkey(
            booking_number,
            user_id,
            study_hall_id,
            profiles!bookings_user_id_fkey(full_name, email),
            study_halls!bookings_study_hall_id_fkey(name, merchant_id)
          )
        `);

      // Apply role-based filters
      if (userRole === 'merchant') {
        // Filter by merchant's study halls
        const { data: merchantStudyHalls } = await supabase
          .from('study_halls')
          .select('id')
          .eq('merchant_id', user?.id);
        
        if (merchantStudyHalls?.length) {
          const { data: merchantBookings } = await supabase
            .from('bookings')
            .select('id')
            .in('study_hall_id', merchantStudyHalls.map(sh => sh.id));
          
          if (merchantBookings?.length) {
            query = query.in('booking_id', merchantBookings.map(b => b.id));
          }
        }
      } else if (userRole === 'student') {
        const { data: studentBookings } = await supabase
          .from('bookings')
          .select('id')
          .eq('user_id', user?.id);
        
        if (studentBookings?.length) {
          query = query.in('booking_id', studentBookings.map(b => b.id));
        }
      }

      // Apply additional filters
      if (filters.dateFrom) {
        query = query.gte('created_at', filters.dateFrom);
      }
      if (filters.dateTo) {
        query = query.lte('created_at', filters.dateTo);
      }
      if (filters.status && filters.status !== 'all') {
        query = query.eq('status', filters.status);
      }
      if (filters.paymentMethod && filters.paymentMethod !== 'all') {
        query = query.eq('payment_method', filters.paymentMethod);
      }

      const { data, error } = await query.order('created_at', { ascending: false });
      
      if (error) {
        console.error('Transactions query error:', error);
        throw error;
      }

      // Transform data and add net_amount calculation
      const transformedData = data?.map(transaction => ({
        ...transaction,
        booking: transaction.bookings,
        net_amount: transaction.amount * 0.9 // Assuming 10% platform fee
      })) || [];

      return transformedData;
    } catch (error) {
      console.error('Error fetching transactions report:', error);
      toast({
        title: "Error",
        description: `Failed to fetch transactions report: ${error.message}`,
        variant: "destructive",
      });
      return [];
    } finally {
      setLoading(false);
    }
  };

  const fetchSettlementsReport = async (filters: ReportFilter = {}) => {
    if (userRole === 'student') return [];
    
    setLoading(true);
    try {
      let query = supabase
        .from('settlements')
        .select(`
          *,
          profiles!settlements_merchant_id_fkey(full_name, email, merchant_number)
        `);

      // Apply role-based filters
      if (userRole === 'merchant') {
        query = query.eq('merchant_id', user?.id);
      }

      // Apply additional filters
      if (filters.dateFrom) {
        query = query.gte('created_at', filters.dateFrom);
      }
      if (filters.dateTo) {
        query = query.lte('created_at', filters.dateTo);
      }
      if (filters.status && filters.status !== 'all') {
        query = query.eq('status', filters.status);
      }
      if (filters.merchantId && userRole === 'admin') {
        query = query.eq('merchant_id', filters.merchantId);
      }

      const { data, error } = await query.order('created_at', { ascending: false });
      
      if (error) {
        console.error('Settlements query error:', error);
        throw error;
      }

      // Transform data to match expected structure
      const transformedData = data?.map(settlement => ({
        ...settlement,
        merchant: settlement.profiles
      })) || [];

      return transformedData;
    } catch (error) {
      console.error('Error fetching settlements report:', error);
      toast({
        title: "Error",
        description: `Failed to fetch settlements report: ${error.message}`,
        variant: "destructive",
      });
      return [];
    } finally {
      setLoading(false);
    }
  };

  const fetchStudyHallsReport = async (filters: ReportFilter = {}) => {
    if (userRole === 'student') return [];
    
    setLoading(true);
    try {
      let query = supabase
        .from('study_halls')
        .select(`
          *,
          profiles!study_halls_merchant_id_fkey(full_name, email, merchant_number)
        `);

      // Apply role-based filters
      if (userRole === 'merchant') {
        query = query.eq('merchant_id', user?.id);
      }

      // Apply additional filters
      if (filters.merchantId && userRole === 'admin') {
        query = query.eq('merchant_id', filters.merchantId);
      }
      if (filters.status && filters.status !== 'all') {
        query = query.eq('status', filters.status);
      }

      const { data, error } = await query.order('created_at', { ascending: false });
      
      if (error) {
        console.error('Study halls query error:', error);
        throw error;
      }

      // Get booking stats for each study hall
      const studyHallsWithStats = await Promise.all(
        (data || []).map(async (studyHall) => {
          const { data: bookingStats } = await supabase
            .from('bookings')
            .select('total_amount')
            .eq('study_hall_id', studyHall.id)
            .eq('status', 'completed')
            .eq('payment_status', 'paid');

          return {
            ...studyHall,
            merchant: studyHall.profiles,
            bookings_count: bookingStats?.length || 0,
            total_revenue: bookingStats?.reduce((sum, b) => sum + Number(b.total_amount), 0) || 0
          };
        })
      );

      return studyHallsWithStats;
    } catch (error) {
      console.error('Error fetching study halls report:', error);
      toast({
        title: "Error",
        description: `Failed to fetch study halls report: ${error.message}`,
        variant: "destructive",
      });
      return [];
    } finally {
      setLoading(false);
    }
  };

  const fetchSubscriptionsReport = async (filters: ReportFilter = {}) => {
    if (userRole !== 'admin') return [];
    
    setLoading(true);
    try {
      let query = supabase
        .from('merchant_subscriptions')
        .select(`
          *,
          profiles!merchant_subscriptions_merchant_id_fkey(full_name, email, merchant_number),
          subscription_plans!merchant_subscriptions_plan_id_fkey(name, price, duration)
        `);

      // Apply additional filters
      if (filters.dateFrom) {
        query = query.gte('start_date', filters.dateFrom);
      }
      if (filters.dateTo) {
        query = query.lte('end_date', filters.dateTo);
      }
      if (filters.status && filters.status !== 'all') {
        query = query.eq('status', filters.status);
      }
      if (filters.planType && filters.planType !== 'all') {
        query = query.eq('plan_type', filters.planType);
      }

      const { data, error } = await query.order('created_at', { ascending: false });
      
      if (error) {
        console.error('Subscriptions query error:', error);
        throw error;
      }

      // Transform data to match expected structure
      const transformedData = data?.map(subscription => ({
        ...subscription,
        merchant: subscription.profiles,
        plan: subscription.subscription_plans
      })) || [];

      return transformedData;
    } catch (error) {
      console.error('Error fetching subscriptions report:', error);
      toast({
        title: "Error",
        description: `Failed to fetch subscriptions report: ${error.message}`,
        variant: "destructive",
      });
      return [];
    } finally {
      setLoading(false);
    }
  };

  const fetchCouponsReport = async (filters: ReportFilter = {}) => {
    if (userRole === 'student') return [];
    
    setLoading(true);
    try {
      let query = supabase
        .from('coupon_usage')
        .select(`
          *,
          coupons!coupon_usage_coupon_id_fkey(code, title, type, value, merchant_id),
          profiles!coupon_usage_user_id_fkey(full_name, email),
          bookings!coupon_usage_booking_id_fkey(booking_number, study_hall_id)
        `);

      // Apply role-based filters
      if (userRole === 'merchant') {
        // Filter by merchant's coupons
        const { data: merchantCoupons } = await supabase
          .from('coupons')
          .select('id')
          .eq('merchant_id', user?.id);
        
        if (merchantCoupons?.length) {
          query = query.in('coupon_id', merchantCoupons.map(c => c.id));
        }
      }

      // Apply additional filters
      if (filters.dateFrom) {
        query = query.gte('used_at', filters.dateFrom);
      }
      if (filters.dateTo) {
        query = query.lte('used_at', filters.dateTo);
      }

      const { data, error } = await query.order('used_at', { ascending: false });
      
      if (error) {
        console.error('Coupons query error:', error);
        throw error;
      }

      // Transform data to match expected structure
      const transformedData = data?.map(usage => ({
        ...usage,
        coupon: usage.coupons,
        user: usage.profiles,
        booking: usage.bookings
      })) || [];

      return transformedData;
    } catch (error) {
      console.error('Error fetching coupons report:', error);
      toast({
        title: "Error",
        description: `Failed to fetch coupons report: ${error.message}`,
        variant: "destructive",
      });
      return [];
    } finally {
      setLoading(false);
    }
  };

  const fetchRewardsReport = async (filters: ReportFilter = {}) => {
    if (userRole !== 'student') return [];
    
    setLoading(true);
    try {
      let query = supabase
        .from('reward_transactions')
        .select(`
          *,
          bookings!reward_transactions_booking_id_fkey(booking_number, study_hall_id)
        `)
        .eq('user_id', user?.id);

      // Apply additional filters
      if (filters.dateFrom) {
        query = query.gte('created_at', filters.dateFrom);
      }
      if (filters.dateTo) {
        query = query.lte('created_at', filters.dateTo);
      }

      const { data, error } = await query.order('created_at', { ascending: false });
      
      if (error) {
        console.error('Rewards query error:', error);
        throw error;
      }

      // Transform data to match expected structure
      const transformedData = data?.map(reward => ({
        ...reward,
        booking: reward.bookings
      })) || [];

      return transformedData;
    } catch (error) {
      console.error('Error fetching rewards report:', error);
      toast({
        title: "Error",
        description: `Failed to fetch rewards report: ${error.message}`,
        variant: "destructive",
      });
      return [];
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    fetchBookingsReport,
    fetchTransactionsReport,
    fetchSettlementsReport,
    fetchStudyHallsReport,
    fetchSubscriptionsReport,
    fetchCouponsReport,
    fetchRewardsReport
  };
};