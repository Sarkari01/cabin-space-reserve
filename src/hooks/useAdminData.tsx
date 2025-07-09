import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

export interface AdminStats {
  totalUsers: number;
  totalMerchants: number;
  totalStudents: number;
  activeStudyHalls: number;
  totalBookings: number;
  monthlyRevenue: number;
}

export interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  role: 'admin' | 'merchant' | 'student';
  created_at: string;
  updated_at: string;
}

export interface StudyHallWithOwner {
  id: string;
  name: string;
  description: string | null;
  location: string;
  total_seats: number;
  rows: number;
  seats_per_row: number;
  daily_price: number;
  weekly_price: number;
  monthly_price: number;
  image_url: string | null;
  status: string;
  created_at: string;
  merchant_id: string;
  owner?: {
    full_name: string | null;
    email: string;
  };
}

export const useAdminData = () => {
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0,
    totalMerchants: 0,
    totalStudents: 0,
    activeStudyHalls: 0,
    totalBookings: 0,
    monthlyRevenue: 0,
  });
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [merchants, setMerchants] = useState<UserProfile[]>([]);
  const [students, setStudents] = useState<UserProfile[]>([]);
  const [studyHalls, setStudyHalls] = useState<StudyHallWithOwner[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchStats = async () => {
    try {
      // Get total users count
      const { count: usersCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      // Get merchants count
      const { count: merchantsCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'merchant');

      // Get students count
      const { count: studentsCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'student');

      // Get active study halls count
      const { count: studyHallsCount } = await supabase
        .from('study_halls')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active');

      // Get total bookings count
      const { count: bookingsCount } = await supabase
        .from('bookings')
        .select('*', { count: 'exact', head: true });

      // Calculate monthly revenue (approximate)
      const { data: bookings } = await supabase
        .from('bookings')
        .select('total_amount')
        .gte('created_at', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString());

      const monthlyRevenue = bookings?.reduce((sum, booking) => sum + Number(booking.total_amount), 0) || 0;

      setStats({
        totalUsers: usersCount || 0,
        totalMerchants: merchantsCount || 0,
        totalStudents: studentsCount || 0,
        activeStudyHalls: studyHallsCount || 0,
        totalBookings: bookingsCount || 0,
        monthlyRevenue,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to fetch dashboard statistics",
        variant: "destructive",
      });
    }
  };

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const allUsers = data || [];
      setUsers(allUsers);
      setMerchants(allUsers.filter(u => u.role === 'merchant'));
      setStudents(allUsers.filter(u => u.role === 'student'));
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to fetch users",
        variant: "destructive",
      });
    }
  };

  const fetchStudyHalls = async () => {
    try {
      const { data, error } = await supabase
        .from('study_halls')
        .select(`
          *,
          profiles!study_halls_merchant_id_fkey (
            full_name,
            email
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const studyHallsWithOwner = (data || []).map(hall => ({
        ...hall,
        owner: hall.profiles,
      }));

      setStudyHalls(studyHallsWithOwner);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to fetch study halls",
        variant: "destructive",
      });
    }
  };

  const createUser = async (userData: {
    email: string;
    password: string;
    full_name: string;
    role: 'merchant' | 'student';
    phone?: string;
  }) => {
    try {
      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: userData.email,
        password: userData.password,
        email_confirm: true,
        user_metadata: {
          full_name: userData.full_name,
          role: userData.role,
        },
      });

      if (authError) throw authError;

      // Create profile
      const { error: profileError } = await supabase
        .from('profiles')
        .insert([{
          id: authData.user.id,
          email: userData.email,
          full_name: userData.full_name,
          role: userData.role,
          phone: userData.phone,
        }]);

      if (profileError) throw profileError;

      await fetchUsers();
      await fetchStats();

      toast({
        title: "Success",
        description: "User created successfully",
      });

      return { data: authData.user, error: null };
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create user",
        variant: "destructive",
      });
      return { data: null, error };
    }
  };

  const updateUserRole = async (userId: string, newRole: 'admin' | 'merchant' | 'student') => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', userId);

      if (error) throw error;

      await fetchUsers();
      toast({
        title: "Success",
        description: "User role updated successfully",
      });

      return { error: null };
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update user role",
        variant: "destructive",
      });
      return { error };
    }
  };

  const deleteUser = async (userId: string) => {
    try {
      // Delete profile first (auth user will be deleted via trigger)
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId);

      if (error) throw error;

      await fetchUsers();
      await fetchStats();

      toast({
        title: "Success",
        description: "User deleted successfully",
      });

      return { error: null };
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete user",
        variant: "destructive",
      });
      return { error };
    }
  };

  const updateStudyHallStatus = async (studyHallId: string, status: string) => {
    try {
      const { error } = await supabase
        .from('study_halls')
        .update({ status })
        .eq('id', studyHallId);

      if (error) throw error;

      await fetchStudyHalls();
      await fetchStats();

      toast({
        title: "Success",
        description: `Study hall ${status === 'active' ? 'approved' : 'disabled'} successfully`,
      });

      return { error: null };
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update study hall status",
        variant: "destructive",
      });
      return { error };
    }
  };

  const fetchData = async () => {
    setLoading(true);
    await Promise.all([
      fetchStats(),
      fetchUsers(),
      fetchStudyHalls(),
    ]);
    setLoading(false);
  };

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  return {
    stats,
    users,
    merchants,
    students,
    studyHalls,
    loading,
    fetchData,
    createUser,
    updateUserRole,
    deleteUser,
    updateStudyHallStatus,
  };
};