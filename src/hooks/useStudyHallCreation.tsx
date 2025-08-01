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
      console.log('🔐 User context:', { id: user.id, email: user.email });

      // Generate custom row names if not provided (A, B, C, D, etc.)
      const customRowNames = data.custom_row_names?.length > 0 
        ? data.custom_row_names 
        : Array.from({ length: data.rows }, (_, i) => String.fromCharCode(65 + i));

      // Validate data consistency
      if (data.rows * data.seats_per_row !== data.total_seats) {
        toast({
          title: "Invalid Configuration",
          description: "Total seats must equal rows × seats per row",
          variant: "destructive"
        });
        return { success: false };
      }

      // Prepare data for database insert with all required fields
      const insertData = {
        merchant_id: user.id,
        name: data.name.trim(),
        description: data.description?.trim() || '',
        location: data.location.trim(),
        formatted_address: data.formatted_address,
        total_seats: data.total_seats,
        rows: data.rows,
        seats_per_row: data.seats_per_row,
        custom_row_names: customRowNames,
        monthly_price: data.monthly_price,
        amenities: data.amenities || [],
        latitude: data.latitude,
        longitude: data.longitude,
        image_url: data.image_url,
        status: 'active'
      };

      console.log('📝 Insert data prepared:', insertData);

      const { data: studyHall, error } = await supabase
        .from('study_halls')
        .insert([insertData])
        .select()
        .single();

      if (error) {
        console.error('❌ Study hall creation error:', error);
        console.error('❌ Error details:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        
        let errorMessage = "Failed to create study hall";
        
        if (error.message?.includes('violates row-level security')) {
          errorMessage = "Authentication error. Please log out and log back in.";
        } else if (error.message?.includes('duplicate key')) {
          errorMessage = "A study hall with this name already exists.";
        } else if (error.message?.includes('not-null constraint')) {
          errorMessage = "Missing required information. Please fill all fields.";
        } else if (error.message) {
          errorMessage = error.message;
        }
        
        toast({
          title: "Creation Failed",
          description: errorMessage,
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