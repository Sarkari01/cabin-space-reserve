import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface PrivateHallImage {
  id: string;
  private_hall_id: string;
  image_url: string;
  file_path: string;
  is_main: boolean;
  display_order: number;
  file_size?: number;
  mime_type?: string;
  uploaded_at: string;
}

export const usePrivateHallImages = (privateHallId?: string) => {
  const [images, setImages] = useState<PrivateHallImage[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchImages = async () => {
    if (!privateHallId) return;
    
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('private_hall_images')
        .select('*')
        .eq('private_hall_id', privateHallId)
        .order('display_order');

      if (error) {
        console.error('Error fetching private hall images:', error);
        return;
      }

      setImages(data || []);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchImages();
  }, [privateHallId]);

  const getMainImage = () => {
    return images.find(img => img.is_main) || images[0];
  };

  return {
    images,
    loading,
    fetchImages,
    getMainImage,
  };
};