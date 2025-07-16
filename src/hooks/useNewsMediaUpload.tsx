import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export function useNewsMediaUpload() {
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  const uploadFile = async (file: File): Promise<string | null> => {
    if (!file) return null;

    // Validate file type
    const isImage = file.type.startsWith('image/');
    const isVideo = file.type.startsWith('video/');
    
    if (!isImage && !isVideo) {
      toast({
        title: "Invalid File Type",
        description: "Please select an image or video file.",
        variant: "destructive",
      });
      return null;
    }

    // Validate file size (max 50MB for videos, 10MB for images)
    const maxSize = isVideo ? 50 * 1024 * 1024 : 10 * 1024 * 1024;
    if (file.size > maxSize) {
      toast({
        title: "File Too Large",
        description: `File size must be less than ${isVideo ? '50MB' : '10MB'}.`,
        variant: "destructive",
      });
      return null;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop()?.toLowerCase();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `${isImage ? 'images' : 'videos'}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('news-media')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('news-media')
        .getPublicUrl(filePath);

      toast({
        title: "Upload Successful",
        description: `${isImage ? 'Image' : 'Video'} uploaded successfully.`,
      });

      return publicUrl;
    } catch (error: any) {
      console.error('Error uploading file:', error);
      toast({
        title: "Upload Error",
        description: error.message || "Failed to upload file. Please try again.",
        variant: "destructive",
      });
      return null;
    } finally {
      setUploading(false);
    }
  };

  const deleteFile = async (fileUrl: string): Promise<boolean> => {
    try {
      // Extract file path from URL
      const urlParts = fileUrl.split('/');
      const bucketIndex = urlParts.findIndex(part => part === 'news-media');
      if (bucketIndex === -1) return false;
      
      const filePath = urlParts.slice(bucketIndex + 1).join('/');

      const { error } = await supabase.storage
        .from('news-media')
        .remove([filePath]);

      if (error) throw error;

      toast({
        title: "File Deleted",
        description: "File deleted successfully.",
      });

      return true;
    } catch (error: any) {
      console.error('Error deleting file:', error);
      toast({
        title: "Delete Error",
        description: "Failed to delete file.",
        variant: "destructive",
      });
      return false;
    }
  };

  return {
    uploadFile,
    deleteFile,
    uploading
  };
}