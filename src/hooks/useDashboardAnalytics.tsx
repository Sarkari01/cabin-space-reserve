
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export interface DashboardAnalytics {
  // Common analytics
  totalRevenue: number;
  revenueGrowth: number;
  bookingsTrend: Array<{ date: string; bookings: number; revenue: number }>;
  
  // Admin analytics
  userGrowth?: Array<{ date: string; users: number; merchants: number; students: number }>;
  platformStats?: {
    totalUsers: number;
    totalMerchants: number;
    totalStudents: number;
    totalStudyHalls: number;
    totalBookings: number;
    monthlyRevenue: number;
    averageBookingValue: number;
    occupancyRate: number;
  };
  
  // Merchant analytics
  studyHallPerformance?: Array<{ name: string; bookings: number; revenue: number; occupancy: number }>;
  merchantStats?: {
    totalStudyHalls: number;
    activeStudyHalls: number;
    totalSeats: number;
    occupiedSeats: number;
    monthlyEarnings: number;
    averageBookingValue: number;
  };
  
  // Student analytics
  studentStats?: {
    totalBookings: number;
    totalSpent: number;
    favoriteHalls: number;
    averageSessionDuration: number;
    upcomingBookings: number;
    completedBookings: number;
  };
}

export const useDashboardAnalytics = () => {
  const { user, userRole } = useAuth();
  const [analytics, setAnalytics] = useState<DashboardAnalytics>({
    totalRevenue: 0,
    revenueGrowth: 0,
    bookingsTrend: [],
  });
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  const fetchAnalytics = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // Common queries for revenue and booking trends
      const currentDate = new Date();
      const lastMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
      const currentMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      
      // Fetch booking trends for the last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      let trendQuery = supabase
        .from('bookings')
        .select('created_at, total_amount, status')
        .gte('created_at', thirtyDaysAgo.toISOString())
        .in('status', ['confirmed', 'completed']);

      // Role-specific filtering
      if (userRole === 'merchant') {
        const { data: userStudyHalls } = await supabase
          .from('study_halls')
          .select('id')
          .eq('merchant_id', user.id);
        
        if (userStudyHalls && userStudyHalls.length > 0) {
          const studyHallIds = userStudyHalls.map(sh => sh.id);
          trendQuery = trendQuery.in('study_hall_id', studyHallIds);
        }
      } else if (userRole === 'student') {
        trendQuery = trendQuery.eq('user_id', user.id);
      }

      const { data: trendBookings } = await trendQuery;
      let trendData = trendBookings || [];
      if (userRole === 'student') {
        const { data: cabinTrend } = await supabase
          .from('cabin_bookings')
          .select('created_at, total_amount, status')
          .gte('created_at', thirtyDaysAgo.toISOString())
          .in('status', ['active', 'completed'])
          .eq('user_id', user.id);
        trendData = [...trendData, ...(cabinTrend || [])];
      } else if (userRole === 'merchant') {
        const { data: privateHalls } = await supabase
          .from('private_halls')
          .select('id')
          .eq('merchant_id', user.id);
        const privateHallIds = privateHalls?.map(ph => ph.id) || [];
        if (privateHallIds.length > 0) {
          const { data: cabinTrend } = await supabase
            .from('cabin_bookings')
            .select('created_at, total_amount, status, private_hall_id')
            .gte('created_at', thirtyDaysAgo.toISOString())
            .in('status', ['active', 'completed'])
            .in('private_hall_id', privateHallIds);
          trendData = [...trendData, ...(cabinTrend || [])];
        }
      }

      // Process trend data
      const bookingsTrend = [];
      for (let i = 29; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        
        const dayBookings = trendData?.filter(booking => 
          booking.created_at && booking.created_at.startsWith(dateStr)
        ) || [];
        
        bookingsTrend.push({
          date: dateStr,
          bookings: dayBookings.length,
          revenue: dayBookings.reduce((sum, b) => sum + (Number(b.total_amount) || 0), 0)
        });
      }

      // Calculate total revenue and growth
      const totalRevenue = trendData?.reduce((sum, b) => sum + (Number(b.total_amount) || 0), 0) || 0;
      const lastMonthRevenue = trendData?.filter(booking => {
        if (!booking.created_at) return false;
        const bookingDate = new Date(booking.created_at);
        return bookingDate >= lastMonth && bookingDate < currentMonth;
      }).reduce((sum, b) => sum + (Number(b.total_amount) || 0), 0) || 0;
      
      const currentMonthRevenue = trendData?.filter(booking => {
        if (!booking.created_at) return false;
        const bookingDate = new Date(booking.created_at);
        return bookingDate >= currentMonth;
      }).reduce((sum, b) => sum + (Number(b.total_amount) || 0), 0) || 0;
      
      const revenueGrowth = lastMonthRevenue > 0 ? 
        ((currentMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100 : 0;

      let roleSpecificAnalytics = {};

      // Fetch role-specific analytics
      if (userRole === 'admin') {
        const { data: allUsers } = await supabase.from('profiles').select('role, created_at');
        const { data: allStudyHalls } = await supabase.from('study_halls').select('id, status');
        const { data: allBookings } = await supabase.from('bookings').select('total_amount, status');
        
        const totalUsers = allUsers?.length || 0;
        const totalMerchants = allUsers?.filter(u => u.role === 'merchant').length || 0;
        const totalStudents = allUsers?.filter(u => u.role === 'student').length || 0;
        const totalStudyHalls = allStudyHalls?.length || 0;
        const totalBookings = allBookings?.length || 0;
        const monthlyRevenue = allBookings?.filter(b => b.status === 'completed')
          .reduce((sum, b) => sum + (Number(b.total_amount) || 0), 0) || 0;
        const averageBookingValue = totalBookings > 0 ? monthlyRevenue / totalBookings : 0;

        // Generate user growth data
        const userGrowth = [];
        for (let i = 29; i >= 0; i--) {
          const date = new Date();
          date.setDate(date.getDate() - i);
          const dateStr = date.toISOString().split('T')[0];
          
          const dayUsers = allUsers?.filter(user => 
            user.created_at && user.created_at.startsWith(dateStr)
          ) || [];
          
          userGrowth.push({
            date: dateStr,
            users: dayUsers.length,
            merchants: dayUsers.filter(u => u.role === 'merchant').length,
            students: dayUsers.filter(u => u.role === 'student').length
          });
        }

        roleSpecificAnalytics = {
          userGrowth,
          platformStats: {
            totalUsers,
            totalMerchants,
            totalStudents,
            totalStudyHalls,
            totalBookings,
            monthlyRevenue,
            averageBookingValue,
            occupancyRate: 0.75 // Placeholder - would need more complex calculation
          }
        };
      } else if (userRole === 'merchant') {
        const { data: merchantStudyHalls } = await supabase
          .from('study_halls')
          .select('id, name, total_seats, status')
          .eq('merchant_id', user.id);

        const studyHallIds = merchantStudyHalls?.map(sh => sh.id) || [];
        let merchantBookings: any[] = [];
        
        if (studyHallIds.length > 0) {
          const { data: bookingsData } = await supabase
            .from('bookings')
            .select('study_hall_id, total_amount, status')
            .in('study_hall_id', studyHallIds);
          merchantBookings = bookingsData || [];
        }

        // Include private hall (cabin) bookings in merchant metrics
        const { data: merchantPrivateHalls } = await supabase
          .from('private_halls')
          .select('id')
          .eq('merchant_id', user.id);
        const privateHallIds = merchantPrivateHalls?.map(ph => ph.id) || [];
        let merchantCabinBookings: any[] = [];
        if (privateHallIds.length > 0) {
          const { data: cabinBookingsData } = await supabase
            .from('cabin_bookings')
            .select('private_hall_id, total_amount, status')
            .in('private_hall_id', privateHallIds);
          merchantCabinBookings = cabinBookingsData || [];
        }

        const studyHallPerformance = merchantStudyHalls?.map(hall => {
          const hallBookings = merchantBookings?.filter(b => b.study_hall_id === hall.id) || [];
          const revenue = hallBookings.reduce((sum, b) => sum + (Number(b.total_amount) || 0), 0);
          const occupancy = hall.total_seats > 0 ? (hallBookings.length / hall.total_seats) * 100 : 0;
          
          return {
            name: hall.name || 'Unnamed Hall',
            bookings: hallBookings.length,
            revenue,
            occupancy
          };
        }) || [];

        const totalStudyHalls = merchantStudyHalls?.length || 0;
        const activeStudyHalls = merchantStudyHalls?.filter(h => h.status === 'active').length || 0;
        const totalSeats = merchantStudyHalls?.reduce((sum, h) => sum + (h.total_seats || 0), 0) || 0;
        const monthlyEarnings = [...merchantBookings, ...merchantCabinBookings]
          .reduce((sum, b) => sum + (Number(b.total_amount) || 0), 0) || 0;
        const totalBookingsCount = (merchantBookings?.length || 0) + (merchantCabinBookings?.length || 0);
        const averageBookingValue = totalBookingsCount > 0 ? 
          monthlyEarnings / totalBookingsCount : 0;

        roleSpecificAnalytics = {
          studyHallPerformance,
          merchantStats: {
            totalStudyHalls,
            activeStudyHalls,
            totalSeats,
            occupiedSeats: Math.floor(totalSeats * 0.6), // Placeholder
            monthlyEarnings,
            averageBookingValue
          }
        };
      } else if (userRole === 'student') {
        const { data: studentBookings } = await supabase
          .from('bookings')
          .select('total_amount, status, start_date, end_date')
          .eq('user_id', user.id);

        const { data: studentCabinBookings } = await supabase
          .from('cabin_bookings')
          .select('total_amount, status, start_date, end_date')
          .eq('user_id', user.id);

        const allStudentBookings = [
          ...(studentBookings || []),
          ...(studentCabinBookings || []),
        ];

        const totalBookings = allStudentBookings.length;
        const totalSpent = allStudentBookings
          .filter((b: any) => b.status === 'completed')
          .reduce((sum: number, b: any) => sum + (Number(b.total_amount) || 0), 0) || 0;

        const upcomingBookings = allStudentBookings.filter((b: any) =>
          b.status && ['confirmed', 'pending'].includes(b.status) &&
          b.start_date && new Date(b.start_date) >= new Date()
        ).length || 0;

        const completedBookings = allStudentBookings.filter((b: any) => b.status === 'completed').length || 0;

        // Favorites count: study halls + private halls
        const { count: favStudyCount } = await supabase
          .from('favorites')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id);

        const { count: favPrivateCount } = await supabase
          .from('private_hall_favorites')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id);

        const favoriteHalls = (favStudyCount || 0) + (favPrivateCount || 0);

        roleSpecificAnalytics = {
          studentStats: {
            totalBookings,
            totalSpent,
            favoriteHalls,
            averageSessionDuration: 4.5, // Placeholder
            upcomingBookings,
            completedBookings,
          },
        };
      }

      setAnalytics({
        totalRevenue,
        revenueGrowth,
        bookingsTrend,
        ...roleSpecificAnalytics
      });
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
    
    // Set up real-time subscription for bookings
    const channel = supabase
      .channel('analytics-updates')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'bookings'
      }, () => {
        // Debounce updates
        setTimeout(fetchAnalytics, 1000);
      })
      .subscribe();

    // Auto-refresh every 5 minutes
    const interval = setInterval(fetchAnalytics, 5 * 60 * 1000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, [user, userRole]);

  return {
    analytics,
    loading,
    lastUpdate,
    refreshAnalytics: fetchAnalytics
  };
};
