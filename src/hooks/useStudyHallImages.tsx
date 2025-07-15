import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface StudyHallImage {
  id: string;
  study_hall_id: string;
  image_url: string;
  file_path: string;
  is_main: boolean;
  display_order: number;
  uploaded_at: string;
  file_size: number;
  mime_type: string;
}

export const useStudyHallImages = (studyHallId?: string) => {
  const [images, setImages] = useState<StudyHallImage[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const fetchImages = async (hallId: string) => {
    if (!hallId) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('study_hall_images')
        .select('*')
        .eq('study_hall_id', hallId)
        .order('display_order', { ascending: true });

      if (error) throw error;
      setImages(data || []);
    } catch (error) {
      console.error('Error fetching study hall images:', error);
      toast({
        title: "Error",
        description: "Failed to load images",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const uploadImages = async (studyHallId: string, files: File[], mainImageIndex?: number) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('upload-study-hall-images', {
        body: { 
          studyHallId,
          files: await Promise.all(files.map(async (file, index) => ({
            name: file.name,
            type: file.type,
            size: file.size,
            data: await fileToBase64(file),
            isMain: index === (mainImageIndex ?? 0)
          })))
        }
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Images uploaded successfully",
      });

      // Refresh images
      await fetchImages(studyHallId);
      return { data, error: null };
    } catch (error) {
      console.error('Error uploading images:', error);
      toast({
        title: "Error",
        description: "Failed to upload images",
        variant: "destructive",
      });
      return { data: null, error };
    } finally {
      setLoading(false);
    }
  };

  const setMainImage = async (imageId: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('manage-study-hall-images', {
        body: { 
          action: 'setMain',
          imageId 
        }
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Main image updated",
      });

      // Refresh images
      if (studyHallId) {
        await fetchImages(studyHallId);
      }
      return { data, error: null };
    } catch (error) {
      console.error('Error setting main image:', error);
      toast({
        title: "Error",
        description: "Failed to update main image",
        variant: "destructive",
      });
      return { data: null, error };
    } finally {
      setLoading(false);
    }
  };

  const deleteImage = async (imageId: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('manage-study-hall-images', {
        body: { 
          action: 'delete',
          imageId 
        }
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Image deleted successfully",
      });

      // Refresh images
      if (studyHallId) {
        await fetchImages(studyHallId);
      }
      return { data, error: null };
    } catch (error) {
      console.error('Error deleting image:', error);
      toast({
        title: "Error",
        description: "Failed to delete image",
        variant: "destructive",
      });
      return { data: null, error };
    } finally {
      setLoading(false);
    }
  };

  const reorderImages = async (studyHallId: string, imageOrders: { id: string; display_order: number }[]) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('manage-study-hall-images', {
        body: { 
          action: 'reorder',
          studyHallId,
          imageOrders 
        }
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Images reordered successfully",
      });

      // Refresh images
      await fetchImages(studyHallId);
      return { data, error: null };
    } catch (error) {
      console.error('Error reordering images:', error);
      toast({
        title: "Error",
        description: "Failed to reorder images",
        variant: "destructive",
      });
      return { data: null, error };
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (studyHallId) {
      fetchImages(studyHallId);
    }
  }, [studyHallId]);

  return {
    images,
    loading,
    fetchImages,
    uploadImages,
    setMainImage,
    deleteImage,
    reorderImages
  };
};

// Helper function to convert file to base64
const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result.split(',')[1]); // Remove data:image/jpeg;base64, prefix
      } else {
        reject(new Error('Failed to convert file to base64'));
      }
    };
    reader.onerror = error => reject(error);
  });
};