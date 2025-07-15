import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';
import { Tables } from '@/integrations/supabase/types';

type Incharge = Tables<'incharges'>;

interface CreateInchargeData {
  email: string;
  full_name: string;
  mobile: string;
  assigned_study_halls: string[];
  permissions?: any;
}

export const useIncharges = () => {
  const [incharges, setIncharges] = useState<Incharge[]>([]);
  const [loading, setLoading] = useState(true);
  const { user, userRole } = useAuth();

  const fetchIncharges = async () => {
    if (!user) return;

    try {
      setLoading(true);
      let query = supabase.from('incharges').select('*');

      // Only merchants see their own incharges, admins see all
      if (userRole === 'merchant') {
        query = query.eq('merchant_id', user.id);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;
      setIncharges(data || []);
    } catch (error) {
      console.error('Error fetching incharges:', error);
      toast({
        title: "Error",
        description: "Failed to fetch incharges",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createIncharge = async (data: CreateInchargeData) => {
    if (!user) return false;

    try {
      // Generate invitation token
      const invitationToken = crypto.randomUUID();

      const inchargeData = {
        merchant_id: user.id,
        created_by: user.id,
        email: data.email,
        full_name: data.full_name,
        mobile: data.mobile,
        assigned_study_halls: data.assigned_study_halls,
        permissions: data.permissions || {
          view_bookings: true,
          manage_bookings: true,
          view_transactions: true
        },
        invitation_token: invitationToken,
        invitation_sent_at: new Date().toISOString(),
        status: 'active'
      };

      const { error } = await supabase
        .from('incharges')
        .insert([inchargeData]);

      if (error) throw error;

      // Send invitation email
      try {
        await supabase.functions.invoke('send-incharge-invitation', {
          body: {
            email: data.email,
            full_name: data.full_name,
            invitation_token: invitationToken
          }
        });
      } catch (emailError) {
        console.error('Error sending invitation email:', emailError);
        toast({
          title: "Warning",
          description: "Incharge created but invitation email failed to send",
          variant: "destructive",
        });
      }

      await fetchIncharges();
      toast({
        title: "Success",
        description: "Incharge created and invitation sent",
      });
      return true;
    } catch (error: any) {
      console.error('Error creating incharge:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create incharge",
        variant: "destructive",
      });
      return false;
    }
  };

  const updateIncharge = async (id: string, updates: Partial<Incharge>) => {
    try {
      const { error } = await supabase
        .from('incharges')
        .update(updates)
        .eq('id', id);

      if (error) throw error;

      await fetchIncharges();
      toast({
        title: "Success",
        description: "Incharge updated successfully",
      });
      return true;
    } catch (error: any) {
      console.error('Error updating incharge:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update incharge",
        variant: "destructive",
      });
      return false;
    }
  };

  const deleteIncharge = async (id: string) => {
    try {
      const { error } = await supabase
        .from('incharges')
        .delete()
        .eq('id', id);

      if (error) throw error;

      await fetchIncharges();
      toast({
        title: "Success",
        description: "Incharge deleted successfully",
      });
      return true;
    } catch (error: any) {
      console.error('Error deleting incharge:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete incharge",
        variant: "destructive",
      });
      return false;
    }
  };

  const activateIncharge = async (id: string) => {
    return updateIncharge(id, { status: 'active' });
  };

  const suspendIncharge = async (id: string) => {
    return updateIncharge(id, { status: 'suspended' });
  };

  useEffect(() => {
    if (user && (userRole === 'merchant' || userRole === 'admin')) {
      fetchIncharges();
    }
  }, [user, userRole]);

  // Real-time updates
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('incharges-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'incharges'
        },
        () => {
          fetchIncharges();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  return {
    incharges,
    loading,
    fetchIncharges,
    createIncharge,
    updateIncharge,
    deleteIncharge,
    activateIncharge,
    suspendIncharge
  };
};