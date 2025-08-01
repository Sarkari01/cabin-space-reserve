import { useState } from 'react';
import { useStudyHallCreation } from './useStudyHallCreation';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface UploadedImage {
  id: string;
  url: string;
  file: File;
  isMain: boolean;
}

export const useEnhancedStudyHallCreation = () => {
  const { createStudyHall: baseCreateStudyHall, loading } = useStudyHallCreation();
  const { toast } = useToast();
  const [uploadingImages, setUploadingImages] = useState(false);

  const createStudyHallWithImages = async (data: any, images: UploadedImage[] = []) => {
    try {
      // First create the study hall
      const result = await baseCreateStudyHall(data);
      
      if (!result.success || !result.data) {
        return result;
      }

      const studyHallId = result.data.id;

      // Upload images if any
      if (images.length > 0) {
        setUploadingImages(true);
        try {
          await uploadStudyHallImages(studyHallId, images);
          
          toast({
            title: "Complete!",
            description: `Study hall created with ${images.length} images uploaded successfully`,
            variant: "default"
          });
        } catch (imageError) {
          console.error('Image upload failed:', imageError);
          toast({
            title: "Study Hall Created",
            description: "Study hall created but some images failed to upload. You can add them later.",
            variant: "default"
          });
        } finally {
          setUploadingImages(false);
        }
      }

      return result;
    } catch (error) {
      console.error('Enhanced creation error:', error);
      return { success: false, error };
    }
  };

  const uploadStudyHallImages = async (studyHallId: string, images: UploadedImage[]) => {
    const imagesToUpload = await Promise.all(
      images.map(async (img, index) => ({
        fileData: await fileToBase64(img.file),
        fileName: img.file.name,
        isMain: img.isMain,
        displayOrder: index
      }))
    );

    const { data, error } = await supabase.functions.invoke('upload-study-hall-images', {
      body: {
        studyHallId,
        images: imagesToUpload
      }
    });

    if (error) {
      throw new Error(`Image upload failed: ${error.message}`);
    }

    return data;
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result as string;
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = error => reject(error);
    });
  };

  return {
    createStudyHallWithImages,
    loading: loading || uploadingImages
  };
};