import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import type { PrivateHall, Cabin, CabinLayoutData } from '@/types/PrivateHall';

export const usePrivateHalls = () => {
  const [privateHalls, setPrivateHalls] = useState<PrivateHall[]>([]);
  const [loading, setLoading] = useState(true);
  const { userRole } = useAuth();

  const fetchPrivateHalls = async () => {
    try {
      setLoading(true);
      
      let query = supabase.from('private_halls').select('*');
      
      // If merchant, only show their halls
      if (userRole === 'merchant') {
        query = query.eq('merchant_id', (await supabase.auth.getUser()).data.user?.id);
      }
      
      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching private halls:', error);
        toast.error('Failed to fetch private halls');
        return;
      }

      setPrivateHalls(data || []);
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to fetch private halls');
    } finally {
      setLoading(false);
    }
  };

  const createPrivateHall = async (hallData: Omit<PrivateHall, 'id' | 'created_at' | 'updated_at' | 'cabin_count' | 'total_revenue'>) => {
    try {
      // Auto-set merchant_id if not provided and user is merchant
      const { data: user } = await supabase.auth.getUser();
      if (!hallData.merchant_id && user?.user?.id && userRole === 'merchant') {
        hallData.merchant_id = user.user.id;
      }

      const { data, error } = await supabase
        .from('private_halls')
        .insert([hallData])
        .select()
        .single();

      if (error) {
        console.error('Error creating private hall:', error);
        toast.error('Failed to create private hall');
        return null;
      }

      // If cabin layout exists, sync cabin records
      if (data.cabin_layout_json) {
        try {
          const { error: syncError } = await supabase.rpc('sync_private_hall_cabins', {
            p_private_hall_id: data.id,
            p_layout_json: data.cabin_layout_json
          });
          
          if (syncError) {
            console.error('Error syncing cabins for new private hall:', syncError);
            // Don't fail the hall creation, just log the error
            console.warn('Private hall created but cabin sync failed. Cabins will be synced on first booking attempt.');
          }
        } catch (syncErr) {
          console.error('Cabin sync exception:', syncErr);
        }
      }

      toast.success('Private hall created successfully');
      await fetchPrivateHalls();
      return data;
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to create private hall');
      return null;
    }
  };

  const updatePrivateHall = async (id: string, hallData: Partial<PrivateHall>) => {
    try {
      const { error } = await supabase
        .from('private_halls')
        .update(hallData)
        .eq('id', id);

      if (error) {
        console.error('Error updating private hall:', error);
        toast.error('Failed to update private hall');
        return false;
      }

      toast.success('Private hall updated successfully');
      await fetchPrivateHalls();
      return true;
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to update private hall');
      return false;
    }
  };

  const deletePrivateHall = async (id: string) => {
    try {
      const { error } = await supabase
        .from('private_halls')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting private hall:', error);
        toast.error('Failed to delete private hall');
        return false;
      }

      toast.success('Private hall deleted successfully');
      await fetchPrivateHalls();
      return true;
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to delete private hall');
      return false;
    }
  };

  useEffect(() => {
    fetchPrivateHalls();
  }, [userRole]);

  return {
    privateHalls,
    loading,
    fetchPrivateHalls,
    createPrivateHall,
    updatePrivateHall,
    deletePrivateHall,
  };
};

export const useCabins = (privateHallId?: string) => {
  const [cabins, setCabins] = useState<Cabin[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchCabins = async () => {
    if (!privateHallId) return;
    
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('cabins')
        .select('*')
        .eq('private_hall_id', privateHallId)
        .order('cabin_number');

      if (error) {
        console.error('Error fetching cabins:', error);
        toast.error('Failed to fetch cabins');
        return;
      }

      setCabins(data || []);
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to fetch cabins');
    } finally {
      setLoading(false);
    }
  };

  const createCabins = async (cabinsData: Omit<Cabin, 'id' | 'created_at' | 'updated_at'>[]) => {
    try {
      const { data, error } = await supabase
        .from('cabins')
        .insert(cabinsData)
        .select();

      if (error) {
        console.error('Error creating cabins:', error);
        toast.error('Failed to create cabins');
        return null;
      }

      toast.success('Cabins created successfully');
      await fetchCabins();
      return data;
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to create cabins');
      return null;
    }
  };

  const updateCabin = async (id: string, cabinData: Partial<Cabin>) => {
    try {
      const { error } = await supabase
        .from('cabins')
        .update(cabinData)
        .eq('id', id);

      if (error) {
        console.error('Error updating cabin:', error);
        toast.error('Failed to update cabin');
        return false;
      }

      toast.success('Cabin updated successfully');
      await fetchCabins();
      return true;
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to update cabin');
      return false;
    }
  };

  useEffect(() => {
    fetchCabins();
  }, [privateHallId]);

  return {
    cabins,
    loading,
    fetchCabins,
    createCabins,
    updateCabin,
  };
};