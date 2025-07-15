import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

export interface OperationalUser {
  id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  role: 'telemarketing_executive' | 'pending_payments_caller' | 'customer_care_executive' | 'settlement_manager' | 'general_administrator';
  created_at: string;
  updated_at: string;
  admin_profile?: {
    id: string;
    department?: string;
    hire_date?: string;
    employee_id?: string;
    permissions: any;
    status: 'active' | 'inactive' | 'suspended';
  };
}

export const useOperationalUsers = () => {
  const [operationalUsers, setOperationalUsers] = useState<OperationalUser[]>([]);
  const [loading, setLoading] = useState(true);
  const { userRole } = useAuth();
  const { toast } = useToast();

  const fetchOperationalUsers = async () => {
    try {
      setLoading(true);
      
      // Only admins and general administrators can view operational users
      if (!userRole || !['admin', 'general_administrator'].includes(userRole)) {
        setOperationalUsers([]);
        return;
      }

      const { data, error } = await supabase
        .from('profiles')
        .select(`
          *,
          admin_profile:admin_user_profiles(*)
        `)
        .in('role', [
          'telemarketing_executive',
          'pending_payments_caller', 
          'customer_care_executive',
          'settlement_manager',
          'general_administrator'
        ])
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Fetch operational users error:', error);
        throw error;
      }

      const transformedData = (data || []).map(user => ({
        ...user,
        admin_profile: user.admin_profile && user.admin_profile.length > 0 ? {
          id: user.admin_profile[0].id,
          department: user.admin_profile[0].department,
          hire_date: user.admin_profile[0].hire_date,
          employee_id: user.admin_profile[0].employee_id,
          permissions: user.admin_profile[0].permissions,
          status: user.admin_profile[0].status
        } : undefined
      })) as OperationalUser[];
      
      setOperationalUsers(transformedData);
      
      // Only show error if there's an actual error, not just empty results
      if (data && data.length === 0) {
        console.log('No operational users found');
      }
    } catch (error: any) {
      console.error('Error fetching operational users:', error);
      // Only show toast for actual errors, not empty results
      if (error.message && !error.message.includes('No rows')) {
        toast({
          title: "Error",
          description: error.message || "Failed to fetch operational users",
          variant: "destructive"
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const createOperationalUser = async (userData: {
    email: string;
    password: string;
    full_name: string;
    phone?: string;
    role: OperationalUser['role'];
    department?: string;
    employee_id?: string;
    permissions?: any;
  }) => {
    try {
      console.log('Creating operational user:', userData);
      
      // Create the user profile through admin endpoint
      const { data: response, error: profileError } = await supabase.functions.invoke('admin-create-user', {
        body: {
          email: userData.email,
          password: userData.password,
          user_metadata: {
            full_name: userData.full_name,
            phone: userData.phone,
            role: userData.role
          }
        }
      });

      if (profileError) {
        console.error('Profile creation error:', profileError);
        throw new Error(profileError.message || 'Failed to create user');
      }

      if (!response || !response.user) {
        throw new Error('Invalid response from user creation');
      }

      // Create admin profile if additional data provided
      if (userData.department || userData.employee_id || userData.permissions) {
        const { error: adminProfileError } = await supabase
          .from('admin_user_profiles')
          .insert({
            user_id: response.user.id,
            department: userData.department,
            employee_id: userData.employee_id,
            permissions: userData.permissions || {},
            status: 'active'
          });

        if (adminProfileError) {
          console.error('Admin profile creation error:', adminProfileError);
          // Don't fail the entire operation if admin profile creation fails
          console.warn('Admin profile creation failed, but user was created successfully');
        }
      }

      toast({
        title: "Success",
        description: "Operational user created successfully"
      });

      fetchOperationalUsers(); // Refresh the list
    } catch (error: any) {
      console.error('Create operational user error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create operational user",
        variant: "destructive"
      });
      throw error;
    }
  };

  const updateOperationalUser = async (userId: string, updates: {
    full_name?: string;
    phone?: string;
    department?: string;
    permissions?: any;
    status?: 'active' | 'inactive' | 'suspended';
  }) => {
    try {
      // Update profile
      if (updates.full_name || updates.phone) {
        const { error: profileError } = await supabase
          .from('profiles')
          .update({
            full_name: updates.full_name,
            phone: updates.phone
          })
          .eq('id', userId);

        if (profileError) throw profileError;
      }

      // Update admin profile
      if (updates.department || updates.permissions || updates.status) {
        const { error: adminProfileError } = await supabase
          .from('admin_user_profiles')
          .upsert({
            user_id: userId,
            department: updates.department,
            permissions: updates.permissions,
            status: updates.status
          })
          .eq('user_id', userId);

        if (adminProfileError) throw adminProfileError;
      }

      toast({
        title: "Success",
        description: "Operational user updated successfully"
      });

      fetchOperationalUsers(); // Refresh the list
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to update operational user",
        variant: "destructive"
      });
      throw error;
    }
  };

  const deleteOperationalUser = async (userId: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId);

      if (error) throw error;

      setOperationalUsers(prev => prev.filter(user => user.id !== userId));
      toast({
        title: "Success",
        description: "Operational user deleted successfully"
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to delete operational user",
        variant: "destructive"
      });
      throw error;
    }
  };

  useEffect(() => {
    fetchOperationalUsers();
  }, [userRole]);

  return {
    operationalUsers,
    loading,
    createOperationalUser,
    updateOperationalUser,
    deleteOperationalUser,
    refetch: fetchOperationalUsers
  };
};