import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "./use-toast";

export interface BusinessSettings {
  id: string;
  ekqr_enabled: boolean;
  ekqr_api_key: string | null;
  offline_enabled: boolean;
  created_at: string;
  updated_at: string;
}

export const useBusinessSettings = () => {
  const { toast } = useToast();
  const [settings, setSettings] = useState<BusinessSettings | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("business_settings")
        .select("*")
        .maybeSingle();

      if (error) throw error;
      
      if (!data) {
        // Create default settings if none exist
        const { data: newData, error: insertError } = await supabase
          .from("business_settings")
          .insert({
            ekqr_enabled: true,
            ekqr_api_key: '3e323980-8939-433c-b8c5-4e1775e917d5',
            offline_enabled: true,
          })
          .select()
          .single();
        
        if (insertError) throw insertError;
        setSettings(newData);
      } else {
        setSettings(data);
      }
    } catch (error) {
      console.error("Error fetching business settings:", error);
      toast({
        title: "Error",
        description: "Failed to fetch business settings",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateSettings = async (updates: Partial<BusinessSettings>) => {
    if (!settings) {
      toast({
        title: "Error",
        description: "No settings found to update",
        variant: "destructive",
      });
      return false;
    }

    try {
      // Get the values that will be set after the update
      const finalEkqrApiKey = updates.ekqr_api_key !== undefined 
        ? updates.ekqr_api_key 
        : settings.ekqr_api_key;

      // Only validate if trying to enable without required fields
      if (updates.ekqr_enabled === true && (!finalEkqrApiKey || !finalEkqrApiKey.trim())) {
        toast({
          title: "Validation Error",
          description: "EKQR API Key is required when enabling EKQR",
          variant: "destructive",
        });
        return false;
      }

      const { error } = await supabase
        .from("business_settings")
        .update(updates)
        .eq("id", settings.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Business settings updated successfully",
      });

      await fetchSettings();
      return true;
    } catch (error) {
      console.error("Error updating business settings:", error);
      toast({
        title: "Error",
        description: "Failed to update business settings",
        variant: "destructive",
      });
      return false;
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  return {
    settings,
    loading,
    fetchSettings,
    updateSettings,
  };
};