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
          user:profiles!bookings_user_id_fkey(full_name, email),
          study_hall:study_halls!bookings_study_hall_id_fkey(name, location),
          seat:seats!bookings_seat_id_fkey(seat_id)
        `);

      // Apply role-based filters
      if (userRole === 'merchant') {
        query = query.eq('study_halls.merchant_id', user?.id);
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
      if (filters.merchantId && userRole === 'admin') {
        query = query.eq('study_halls.merchant_id', filters.merchantId);
      }
      if (filters.studyHallId) {
        query = query.eq('study_hall_id', filters.studyHallId);
      }

      const { data, error } = await query.order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching bookings report:', error);
      toast({
        title: "Error",
        description: "Failed to fetch bookings report",
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
          booking:bookings!transactions_booking_id_fkey(
            booking_number,
            user:profiles!bookings_user_id_fkey(full_name, email),
            study_hall:study_halls!bookings_study_hall_id_fkey(name, merchant_id)
          )
        `);

      // Apply role-based filters
      if (userRole === 'merchant') {
        query = query.eq('bookings.study_halls.merchant_id', user?.id);
      } else if (userRole === 'student') {
        query = query.eq('bookings.user_id', user?.id);
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
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching transactions report:', error);
      toast({
        title: "Error",
        description: "Failed to fetch transactions report",
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
          merchant:profiles!settlements_merchant_id_fkey(full_name, email, merchant_number)
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
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching settlements report:', error);
      toast({
        title: "Error",
        description: "Failed to fetch settlements report",
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
          merchant:profiles!study_halls_merchant_id_fkey(full_name, email, merchant_number),
          bookings_count:bookings(count),
          total_revenue:bookings(total_amount)
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
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching study halls report:', error);
      toast({
        title: "Error",
        description: "Failed to fetch study halls report",
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
          merchant:profiles!merchant_subscriptions_merchant_id_fkey(full_name, email, merchant_number),
          plan:subscription_plans!merchant_subscriptions_plan_id_fkey(name, price, duration)
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
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching subscriptions report:', error);
      toast({
        title: "Error",
        description: "Failed to fetch subscriptions report",
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
          coupon:coupons!coupon_usage_coupon_id_fkey(code, title, type, value),
          user:profiles!coupon_usage_user_id_fkey(full_name, email),
          booking:bookings!coupon_usage_booking_id_fkey(booking_number, study_hall_id)
        `);

      // Apply role-based filters
      if (userRole === 'merchant') {
        query = query.eq('coupons.merchant_id', user?.id);
      }

      // Apply additional filters
      if (filters.dateFrom) {
        query = query.gte('used_at', filters.dateFrom);
      }
      if (filters.dateTo) {
        query = query.lte('used_at', filters.dateTo);
      }

      const { data, error } = await query.order('used_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching coupons report:', error);
      toast({
        title: "Error",
        description: "Failed to fetch coupons report",
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
          booking:bookings!reward_transactions_booking_id_fkey(booking_number, study_hall_id)
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
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching rewards report:', error);
      toast({
        title: "Error",
        description: "Failed to fetch rewards report",
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