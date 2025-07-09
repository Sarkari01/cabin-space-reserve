import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";
import { useToast } from "@/hooks/use-toast";

export type Banner = Tables<"banners">;
export type CreateBannerData = TablesInsert<"banners">;
export type UpdateBannerData = TablesUpdate<"banners">;

export const useBanners = (targetAudience?: string) => {
  return useQuery({
    queryKey: ["banners", targetAudience],
    queryFn: async () => {
      let query = supabase
        .from("banners")
        .select("*")
        .order("priority", { ascending: false })
        .order("created_at", { ascending: false });

      if (targetAudience) {
        query = query.or(`target_audience.eq.${targetAudience},target_audience.eq.both`);
      }

      const { data, error } = await query;

      if (error) {
        console.error("Error fetching banners:", error);
        throw error;
      }

      return data as Banner[];
    },
  });
};

export const useCreateBanner = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (bannerData: CreateBannerData) => {
      const { data, error } = await supabase
        .from("banners")
        .insert(bannerData)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["banners"] });
      toast({
        title: "Success",
        description: "Banner created successfully",
      });
    },
    onError: (error) => {
      console.error("Error creating banner:", error);
      toast({
        title: "Error",
        description: "Failed to create banner",
        variant: "destructive",
      });
    },
  });
};

export const useUpdateBanner = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: UpdateBannerData }) => {
      const { data, error } = await supabase
        .from("banners")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["banners"] });
      toast({
        title: "Success",
        description: "Banner updated successfully",
      });
    },
    onError: (error) => {
      console.error("Error updating banner:", error);
      toast({
        title: "Error",
        description: "Failed to update banner",
        variant: "destructive",
      });
    },
  });
};

export const useDeleteBanner = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("banners")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["banners"] });
      toast({
        title: "Success",
        description: "Banner deleted successfully",
      });
    },
    onError: (error) => {
      console.error("Error deleting banner:", error);
      toast({
        title: "Error",
        description: "Failed to delete banner",
        variant: "destructive",
      });
    },
  });
};

export const useUploadBannerImage = () => {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (file: File) => {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `banners/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('banner-images')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('banner-images')
        .getPublicUrl(filePath);

      return data.publicUrl;
    },
    onError: (error) => {
      console.error("Error uploading banner image:", error);
      toast({
        title: "Error",
        description: "Failed to upload banner image",
        variant: "destructive",
      });
    },
  });
};