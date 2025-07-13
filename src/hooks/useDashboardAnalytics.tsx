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

      const { data: trendData } = await trendQuery;

      // Process trend data
      const bookingsTrend = [];
      for (let i = 29; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        
        const dayBookings = trendData?.filter(booking => 
          booking.created_at.startsWith(dateStr)
        ) || [];
        
        bookingsTrend.push({
          date: dateStr,
          bookings: dayBookings.length,
          revenue: dayBookings.reduce((sum, b) => sum + Number(b.total_amount), 0)
        });
      }

      // Calculate total revenue and growth
      const totalRevenue = trendData?.reduce((sum, b) => sum + Number(b.total_amount), 0) || 0;
      const lastMonthRevenue = trendData?.filter(booking => {
        const bookingDate = new Date(booking.created_at);
        return bookingDate >= lastMonth && bookingDate < currentMonth;
      }).reduce((sum, b) => sum + Number(b.total_amount), 0) || 0;
      
      const currentMonthRevenue = trendData?.filter(booking => {
        const bookingDate = new Date(booking.created_at);
        return bookingDate >= currentMonth;
      }).reduce((sum, b) => sum + Number(b.total_amount), 0) || 0;
      
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
          .reduce((sum, b) => sum + Number(b.total_amount), 0) || 0;
        const averageBookingValue = totalBookings > 0 ? monthlyRevenue / totalBookings : 0;

        // Generate user growth data
        const userGrowth = [];
        for (let i = 29; i >= 0; i--) {
          const date = new Date();
          date.setDate(date.getDate() - i);
          const dateStr = date.toISOString().split('T')[0];
          
          const dayUsers = allUsers?.filter(user => 
            user.created_at.startsWith(dateStr)
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

        const { data: merchantBookings } = await supabase
          .from('bookings')
          .select('study_hall_id, total_amount, status')
          .in('study_hall_id', merchantStudyHalls?.map(sh => sh.id) || []);

        const studyHallPerformance = merchantStudyHalls?.map(hall => {
          const hallBookings = merchantBookings?.filter(b => b.study_hall_id === hall.id) || [];
          const revenue = hallBookings.reduce((sum, b) => sum + Number(b.total_amount), 0);
          const occupancy = hall.total_seats > 0 ? (hallBookings.length / hall.total_seats) * 100 : 0;
          
          return {
            name: hall.name,
            bookings: hallBookings.length,
            revenue,
            occupancy
          };
        }) || [];

        const totalStudyHalls = merchantStudyHalls?.length || 0;
        const activeStudyHalls = merchantStudyHalls?.filter(h => h.status === 'active').length || 0;
        const totalSeats = merchantStudyHalls?.reduce((sum, h) => sum + h.total_seats, 0) || 0;
        const monthlyEarnings = merchantBookings?.reduce((sum, b) => sum + Number(b.total_amount), 0) || 0;
        const averageBookingValue = merchantBookings && merchantBookings.length > 0 ? 
          monthlyEarnings / merchantBookings.length : 0;

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

        // Note: Favorites feature would need a separate table implementation
        const favorites = []; // Placeholder for favorites functionality

        const totalBookings = studentBookings?.length || 0;
        const totalSpent = studentBookings?.filter(b => b.status === 'completed')
          .reduce((sum, b) => sum + Number(b.total_amount), 0) || 0;
        const favoriteHalls = favorites?.length || 0;
        const upcomingBookings = studentBookings?.filter(b => 
          ['confirmed', 'pending'].includes(b.status) && 
          new Date(b.start_date) >= new Date()
        ).length || 0;
        const completedBookings = studentBookings?.filter(b => b.status === 'completed').length || 0;

        roleSpecificAnalytics = {
          studentStats: {
            totalBookings,
            totalSpent,
            favoriteHalls,
            averageSessionDuration: 4.5, // Placeholder
            upcomingBookings,
            completedBookings
          }
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