import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

export interface StudyHall {
  id: string;
  merchant_id: string;
  name: string;
  description: string;
  location: string;
  total_seats: number;
  rows: number;
  seats_per_row: number;
  custom_row_names: string[];
  amenities: string[];
  daily_price: number;
  weekly_price: number;
  monthly_price: number;
  image_url?: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface Seat {
  id: string;
  study_hall_id: string;
  seat_id: string;
  row_name: string;
  seat_number: number;
  is_available: boolean;
}

export const useStudyHalls = () => {
  const [studyHalls, setStudyHalls] = useState<StudyHall[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchStudyHalls = async () => {
    try {
      setLoading(true);
      let query = supabase.from('study_halls').select('*');
      
      // If user is a merchant, only fetch their study halls
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();
          
        if (profile?.role === 'merchant') {
          query = query.eq('merchant_id', user.id);
        }
      }
      
      const { data, error } = await query.order('created_at', { ascending: false });
      
      if (error) throw error;
      
      // Transform the data to ensure amenities is properly typed
      const transformedData = (data || []).map(hall => ({
        ...hall,
        amenities: Array.isArray(hall.amenities) ? hall.amenities : []
      })) as StudyHall[];
      
      setStudyHalls(transformedData);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to fetch study halls",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createStudyHall = async (studyHallData: Omit<StudyHall, 'id' | 'merchant_id' | 'created_at' | 'updated_at'>) => {
    if (!user) throw new Error('User not authenticated');
    
    try {
      const { data, error } = await supabase
        .from('study_halls')
        .insert([{
          ...studyHallData,
          merchant_id: user.id,
        }])
        .select()
        .single();
        
      if (error) throw error;
      
      await fetchStudyHalls();
      toast({
        title: "Success",
        description: "Study hall created successfully",
      });
      
      return { data, error: null };
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create study hall",
        variant: "destructive",
      });
      return { data: null, error };
    }
  };

  const updateStudyHall = async (id: string, updates: Partial<StudyHall>) => {
    try {
      const { data, error } = await supabase
        .from('study_halls')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
        
      if (error) throw error;
      
      await fetchStudyHalls();
      toast({
        title: "Success",
        description: "Study hall updated successfully",
      });
      
      return { data, error: null };
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update study hall",
        variant: "destructive",
      });
      return { data: null, error };
    }
  };

  const deleteStudyHall = async (id: string) => {
    try {
      const { error } = await supabase
        .from('study_halls')
        .delete()
        .eq('id', id);
        
      if (error) throw error;
      
      await fetchStudyHalls();
      toast({
        title: "Success",
        description: "Study hall deleted successfully",
      });
      
      return { error: null };
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete study hall",
        variant: "destructive",
      });
      return { error };
    }
  };

  const toggleStudyHallStatus = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    
    try {
      const { error } = await supabase
        .from('study_halls')
        .update({ status: newStatus })
        .eq('id', id);
        
      if (error) throw error;
      
      await fetchStudyHalls();
      toast({
        title: "Success",
        description: `Study hall ${newStatus === 'active' ? 'activated' : 'deactivated'} successfully`,
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

  useEffect(() => {
    fetchStudyHalls();
  }, [user]);

  return {
    studyHalls,
    loading,
    fetchStudyHalls,
    createStudyHall,
    updateStudyHall,
    deleteStudyHall,
    toggleStudyHallStatus,
  };
};

export const useSeats = (studyHallId?: string) => {
  const [seats, setSeats] = useState<Seat[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const fetchSeats = async (hallId: string) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('seats')
        .select('*')
        .eq('study_hall_id', hallId)
        .order('row_name')
        .order('seat_number');
        
      if (error) throw error;
      setSeats(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to fetch seats",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (studyHallId) {
      fetchSeats(studyHallId);
    }
  }, [studyHallId]);

  // Real-time subscription for seat updates
  useEffect(() => {
    if (!studyHallId) return;

    const channel = supabase
      .channel('seats-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'seats',
          filter: `study_hall_id=eq.${studyHallId}`
        },
        (payload) => {
          console.log('Seat change detected:', payload);
          fetchSeats(studyHallId); // Refresh seats when changes occur
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [studyHallId]);

  return {
    seats,
    loading,
    fetchSeats,
  };
};