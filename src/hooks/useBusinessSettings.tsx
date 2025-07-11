import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "./use-toast";

export interface BusinessSettings {
  id: string;
  razorpay_enabled: boolean;
  razorpay_key_id: string | null;
  ekqr_enabled: boolean;
  ekqr_merchant_id: string | null;
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
            razorpay_enabled: false,
            razorpay_key_id: null,
            ekqr_enabled: false,
            ekqr_merchant_id: null,
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
      // Validate settings based on what's being enabled
      if (updates.razorpay_enabled && !updates.razorpay_key_id && !settings.razorpay_key_id) {
        toast({
          title: "Validation Error",
          description: "Razorpay Key ID is required when enabling Razorpay",
          variant: "destructive",
        });
        return false;
      }

      if (updates.ekqr_enabled && !updates.ekqr_merchant_id && !settings.ekqr_merchant_id) {
        toast({
          title: "Validation Error",
          description: "EKQR Merchant ID is required when enabling EKQR",
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