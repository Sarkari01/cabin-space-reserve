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

  const fetchBookingsReport = async (filters: ReportFilter = {}): Promise<ReportData[]> => {
    setLoading(true);
    try {
      console.log('Fetching bookings report with filters:', filters);
      
      // Start with base query
      let query = supabase.from('bookings').select('*');

      // Apply role-based filters first
      if (userRole === 'merchant' && user?.id) {
        // Get merchant's study halls first
        const { data: merchantStudyHalls, error: studyHallsError } = await supabase
          .from('study_halls')
          .select('id')
          .eq('merchant_id', user.id);
        
        if (studyHallsError) {
          console.error('Error fetching merchant study halls:', studyHallsError);
          throw studyHallsError;
        }
        
        if (merchantStudyHalls && merchantStudyHalls.length > 0) {
          const studyHallIds = merchantStudyHalls.map(sh => sh.id);
          query = query.in('study_hall_id', studyHallIds);
        } else {
          // Merchant has no study halls, return empty array
          setLoading(false);
          return [];
        }
      } else if (userRole === 'student' && user?.id) {
        query = query.eq('user_id', user.id);
      } else if (userRole !== 'admin') {
        // Non-admin roles without proper user context
        setLoading(false);
        return [];
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

      if (!data || data.length === 0) {
        return [];
      }

      // Fetch related data separately
      const userIds = [...new Set(data.map(b => b.user_id))];
      const studyHallIds = [...new Set(data.map(b => b.study_hall_id))];
      const seatIds = [...new Set(data.map(b => b.seat_id))];

      const [usersRes, studyHallsRes, seatsRes] = await Promise.all([
        supabase.from('profiles').select('id, full_name, email').in('id', userIds),
        supabase.from('study_halls').select('id, name, location, merchant_id').in('id', studyHallIds),
        supabase.from('seats').select('id, seat_id').in('id', seatIds)
      ]);

      // Create lookup maps
      const usersMap = new Map(usersRes.data?.map(u => [u.id, u]) || []);
      const studyHallsMap = new Map(studyHallsRes.data?.map(sh => [sh.id, sh]) || []);
      const seatsMap = new Map(seatsRes.data?.map(s => [s.id, s]) || []);

      // Transform data to match expected structure
      const transformedData = data.map(booking => ({
        ...booking,
        total_amount: Number(booking.total_amount) || 0,
        user: usersMap.get(booking.user_id) || { full_name: 'Unknown', email: 'N/A' },
        study_hall: studyHallsMap.get(booking.study_hall_id) || { name: 'Unknown', location: 'N/A' },
        seat: seatsMap.get(booking.seat_id) || { seat_id: 'N/A' }
      }));

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

  const fetchTransactionsReport = async (filters: ReportFilter = {}): Promise<ReportData[]> => {
    setLoading(true);
    try {
      console.log('Fetching transactions report with filters:', filters);
      
      let query = supabase.from('transactions').select('*');

      // Apply role-based filters
      if (userRole === 'merchant' && user?.id) {
        // Filter by merchant's study halls
        const { data: merchantStudyHalls, error: studyHallsError } = await supabase
          .from('study_halls')
          .select('id')
          .eq('merchant_id', user.id);
        
        if (studyHallsError) {
          console.error('Error fetching merchant study halls:', studyHallsError);
          throw studyHallsError;
        }
        
        if (merchantStudyHalls && merchantStudyHalls.length > 0) {
          const { data: merchantBookings, error: bookingsError } = await supabase
            .from('bookings')
            .select('id')
            .in('study_hall_id', merchantStudyHalls.map(sh => sh.id));
          
          if (bookingsError) {
            console.error('Error fetching merchant bookings:', bookingsError);
            throw bookingsError;
          }
          
          if (merchantBookings && merchantBookings.length > 0) {
            query = query.in('booking_id', merchantBookings.map(b => b.id));
          } else {
            // Merchant has no bookings, return empty array
            setLoading(false);
            return [];
          }
        } else {
          // Merchant has no study halls, return empty array
          setLoading(false);
          return [];
        }
      } else if (userRole === 'student' && user?.id) {
        const { data: studentBookings, error: bookingsError } = await supabase
          .from('bookings')
          .select('id')
          .eq('user_id', user.id);
        
        if (bookingsError) {
          console.error('Error fetching student bookings:', bookingsError);
          throw bookingsError;
        }
        
        if (studentBookings && studentBookings.length > 0) {
          query = query.in('booking_id', studentBookings.map(b => b.id));
        } else {
          // Student has no bookings, return empty array
          setLoading(false);
          return [];
        }
      } else if (userRole !== 'admin') {
        // Non-admin roles without proper user context
        setLoading(false);
        return [];
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

      if (!data || data.length === 0) {
        return [];
      }

      // Fetch related bookings data separately
      const bookingIds = [...new Set(data.map(t => t.booking_id).filter(Boolean))];
      
      let bookingsData: any[] = [];
      if (bookingIds.length > 0) {
        const { data: bookings, error: bookingsError } = await supabase
          .from('bookings')
          .select('id, booking_number, user_id, study_hall_id')
          .in('id', bookingIds);
        
        if (bookingsError) {
          console.error('Error fetching bookings for transactions:', bookingsError);
        } else {
          bookingsData = bookings || [];
        }
      }

      // Create booking lookup map
      const bookingsMap = new Map(bookingsData.map(b => [b.id, b]));

      // Transform data and add net_amount calculation
      const transformedData = data.map(transaction => ({
        ...transaction,
        amount: Number(transaction.amount) || 0,
        booking: bookingsMap.get(transaction.booking_id) || null,
        net_amount: (Number(transaction.amount) || 0) * 0.9 // Assuming 10% platform fee
      }));

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

  const fetchSettlementsReport = async (filters: ReportFilter = {}): Promise<ReportData[]> => {
    if (userRole === 'student') return [];
    
    setLoading(true);
    try {
      console.log('Fetching settlements report with filters:', filters);
      
      let query = supabase.from('settlements').select('*');

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

      if (!data || data.length === 0) {
        return [];
      }

      // Fetch merchant profiles separately
      const merchantIds = [...new Set(data.map(s => s.merchant_id))];
      const { data: merchants } = await supabase
        .from('profiles')
        .select('id, full_name, email, merchant_number')
        .in('id', merchantIds);

      const merchantsMap = new Map(merchants?.map(m => [m.id, m]) || []);

      // Transform data to match expected structure
      const transformedData = data.map(settlement => ({
        ...settlement,
        total_booking_amount: Number(settlement.total_booking_amount) || 0,
        platform_fee_amount: Number(settlement.platform_fee_amount) || 0,
        net_settlement_amount: Number(settlement.net_settlement_amount) || 0,
        merchant: merchantsMap.get(settlement.merchant_id) || { full_name: 'Unknown', email: 'N/A' }
      }));

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

  const fetchStudyHallsReport = async (filters: ReportFilter = {}): Promise<ReportData[]> => {
    if (userRole === 'student') return [];
    
    setLoading(true);
    try {
      console.log('Fetching study halls report with filters:', filters);
      
      let query = supabase.from('study_halls').select('*');

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

      if (!data || data.length === 0) {
        return [];
      }

      // Fetch merchant profiles separately
      const merchantIds = [...new Set(data.map(sh => sh.merchant_id))];
      const { data: merchants } = await supabase
        .from('profiles')
        .select('id, full_name, email, merchant_number')
        .in('id', merchantIds);

      const merchantsMap = new Map(merchants?.map(m => [m.id, m]) || []);

      // Get booking stats for each study hall
      const studyHallsWithStats = await Promise.all(
        data.map(async (studyHall) => {
          const { data: bookingStats } = await supabase
            .from('bookings')
            .select('total_amount')
            .eq('study_hall_id', studyHall.id)
            .eq('status', 'completed')
            .eq('payment_status', 'paid');

          return {
            ...studyHall,
            monthly_price: Number(studyHall.monthly_price) || 0,
            merchant: merchantsMap.get(studyHall.merchant_id) || { full_name: 'Unknown', email: 'N/A' },
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

  const fetchSubscriptionsReport = async (filters: ReportFilter = {}): Promise<ReportData[]> => {
    if (userRole !== 'admin') return [];
    
    setLoading(true);
    try {
      console.log('Fetching subscriptions report with filters:', filters);
      
      let query = supabase.from('merchant_subscriptions').select('*');

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

      if (!data || data.length === 0) {
        return [];
      }

      // Fetch related data separately
      const merchantIds = [...new Set(data.map(s => s.merchant_id))];
      const planIds = [...new Set(data.map(s => s.plan_id))];

      const [merchantsRes, plansRes] = await Promise.all([
        supabase.from('profiles').select('id, full_name, email, merchant_number').in('id', merchantIds),
        supabase.from('subscription_plans').select('id, name, price, duration').in('id', planIds)
      ]);

      const merchantsMap = new Map(merchantsRes.data?.map(m => [m.id, m]) || []);
      const plansMap = new Map(plansRes.data?.map(p => [p.id, p]) || []);

      // Transform data to match expected structure
      const transformedData = data.map(subscription => ({
        ...subscription,
        merchant: merchantsMap.get(subscription.merchant_id) || { full_name: 'Unknown', email: 'N/A' },
        plan: plansMap.get(subscription.plan_id) || { name: 'Unknown', price: 0, duration: 'N/A' }
      }));

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

  const fetchCouponsReport = async (filters: ReportFilter = {}): Promise<ReportData[]> => {
    if (userRole === 'student') return [];
    
    setLoading(true);
    try {
      console.log('Fetching coupons report with filters:', filters);
      
      let query = supabase.from('coupon_usage').select('*');

      // Apply role-based filters
      if (userRole === 'merchant' && user?.id) {
        // Filter by merchant's coupons
        const { data: merchantCoupons, error: couponsError } = await supabase
          .from('coupons')
          .select('id')
          .eq('merchant_id', user.id);
        
        if (couponsError) {
          console.error('Error fetching merchant coupons:', couponsError);
          throw couponsError;
        }
        
        if (merchantCoupons && merchantCoupons.length > 0) {
          query = query.in('coupon_id', merchantCoupons.map(c => c.id));
        } else {
          // Merchant has no coupons, return empty array
          setLoading(false);
          return [];
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

      if (!data || data.length === 0) {
        return [];
      }

      // Fetch related data separately
      const couponIds = [...new Set(data.map(u => u.coupon_id))];
      const userIds = [...new Set(data.map(u => u.user_id))];
      const bookingIds = [...new Set(data.map(u => u.booking_id).filter(Boolean))];

      const [couponsRes, usersRes, bookingsRes] = await Promise.all([
        supabase.from('coupons').select('id, code, title, type, value, merchant_id').in('id', couponIds),
        supabase.from('profiles').select('id, full_name, email').in('id', userIds),
        bookingIds.length > 0 ? supabase.from('bookings').select('id, booking_number, study_hall_id').in('id', bookingIds) : { data: [] }
      ]);

      const couponsMap = new Map(couponsRes.data?.map(c => [c.id, c]) || []);
      const usersMap = new Map(usersRes.data?.map(u => [u.id, u]) || []);
      const bookingsMap = new Map((bookingsRes.data || []).map(b => [b.id, b]));

      // Transform data to match expected structure
      const transformedData = data.map(usage => ({
        ...usage,
        coupon: couponsMap.get(usage.coupon_id) || { code: 'Unknown', title: 'N/A' },
        user: usersMap.get(usage.user_id) || { full_name: 'Unknown', email: 'N/A' },
        booking: usage.booking_id ? bookingsMap.get(usage.booking_id) || null : null
      }));

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

  const fetchRewardsReport = async (filters: ReportFilter = {}): Promise<ReportData[]> => {
    if (userRole !== 'student') return [];
    
    setLoading(true);
    try {
      console.log('Fetching rewards report with filters:', filters);
      
      let query = supabase
        .from('reward_transactions')
        .select('*')
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

      if (!data || data.length === 0) {
        return [];
      }

      // Fetch related bookings data separately
      const bookingIds = [...new Set(data.map(r => r.booking_id).filter(Boolean))];
      
      let bookingsData: any[] = [];
      if (bookingIds.length > 0) {
        const { data: bookings } = await supabase
          .from('bookings')
          .select('id, booking_number, study_hall_id')
          .in('id', bookingIds);
        
        bookingsData = bookings || [];
      }

      const bookingsMap = new Map(bookingsData.map(b => [b.id, b]));

      // Transform data to match expected structure
      const transformedData = data.map(reward => ({
        ...reward,
        booking: reward.booking_id ? bookingsMap.get(reward.booking_id) || null : null
      }));

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