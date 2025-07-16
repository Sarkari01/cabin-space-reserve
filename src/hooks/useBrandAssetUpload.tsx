import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "./use-toast";

export const useBrandAssetUpload = () => {
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);

  const uploadAsset = async (file: File, assetType: 'logo' | 'favicon'): Promise<string | null> => {
    try {
      setUploading(true);

      // Validate file type
      const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/svg+xml'];
      if (!allowedTypes.includes(file.type)) {
        toast({
          title: "Invalid file type",
          description: "Please upload a PNG, JPEG, WebP, or SVG image",
          variant: "destructive",
        });
        return null;
      }

      // Validate file size (max 5MB)
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (file.size > maxSize) {
        toast({
          title: "File too large",
          description: "Please upload an image smaller than 5MB",
          variant: "destructive",
        });
        return null;
      }

      // Generate unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${assetType}-${Date.now()}.${fileExt}`;
      const filePath = fileName;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('brand-assets')
        .upload(filePath, file);

      if (uploadError) {
        throw uploadError;
      }

      // Get public URL
      const { data: publicUrlData } = supabase.storage
        .from('brand-assets')
        .getPublicUrl(filePath);

      toast({
        title: "Success",
        description: `${assetType === 'logo' ? 'Logo' : 'Favicon'} uploaded successfully`,
      });

      return publicUrlData.publicUrl;
    } catch (error) {
      console.error("Error uploading asset:", error);
      toast({
        title: "Upload failed",
        description: `Failed to upload ${assetType}. Please try again.`,
        variant: "destructive",
      });
      return null;
    } finally {
      setUploading(false);
    }
  };

  const deleteAsset = async (url: string): Promise<boolean> => {
    try {
      // Extract file path from URL
      const urlParts = url.split('/');
      const fileName = urlParts[urlParts.length - 1];

      const { error } = await supabase.storage
        .from('brand-assets')
        .remove([fileName]);

      if (error) {
        throw error;
      }

      return true;
    } catch (error) {
      console.error("Error deleting asset:", error);
      toast({
        title: "Delete failed",
        description: "Failed to delete asset. Please try again.",
        variant: "destructive",
      });
      return false;
    }
  };

  return {
    uploadAsset,
    deleteAsset,
    uploading,
  };
};