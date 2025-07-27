import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from '@/hooks/use-toast';
import { StudyHallCreationData } from '@/types/StudyHallCreation';

export const useStudyHallCreation = () => {
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const createStudyHall = async (data: StudyHallCreationData) => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to create a study hall",
        variant: "destructive"
      });
      return { success: false };
    }

    setLoading(true);
    
    try {
      console.log('🚀 Creating study hall:', data);

      // Prepare data for database insert
      const insertData = {
        merchant_id: user.id,
        name: data.name.trim(),
        description: data.description.trim(),
        location: data.location.trim(),
        formatted_address: data.formatted_address,
        total_seats: data.total_seats,
        rows: data.rows,
        seats_per_row: data.seats_per_row,
        monthly_price: data.monthly_price,
        amenities: data.amenities,
        latitude: data.latitude,
        longitude: data.longitude,
        image_url: data.image_url,
        status: 'active'
      };

      const { data: studyHall, error } = await supabase
        .from('study_halls')
        .insert([insertData])
        .select()
        .single();

      if (error) {
        console.error('❌ Study hall creation error:', error);
        toast({
          title: "Creation Failed",
          description: error.message || "Failed to create study hall",
          variant: "destructive"
        });
        return { success: false, error };
      }

      console.log('✅ Study hall created successfully:', studyHall);
      
      toast({
        title: "Success!",
        description: `${data.name} has been created successfully`,
        variant: "default"
      });

      return { success: true, data: studyHall };

    } catch (error: any) {
      console.error('❌ Unexpected error:', error);
      toast({
        title: "Unexpected Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive"
      });
      return { success: false, error };
    } finally {
      setLoading(false);
    }
  };

  return {
    createStudyHall,
    loading
  };
};