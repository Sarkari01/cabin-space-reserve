import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "./use-toast";

export interface BusinessSettings {
  id: string;
  ekqr_enabled: boolean;
  offline_enabled: boolean;
  razorpay_enabled: boolean;
  platform_fee_percentage?: number;
  minimum_settlement_amount?: number;
  rewards_enabled?: boolean;
  rewards_conversion_rate?: number;
  points_per_booking?: number;
  points_per_referral?: number;
  points_profile_complete?: number;
  min_redemption_points?: number;
  // Brand Identity Fields
  logo_url?: string;
  favicon_url?: string;
  brand_name?: string;
  support_email?: string;
  support_phone?: string;
  website_url?: string;
  tagline?: string;
  business_address?: string;
  copyright_text?: string;
  // Trial Plan Settings
  trial_plan_enabled?: boolean;
  trial_duration_days?: number;
  trial_plan_name?: string;
  trial_max_study_halls?: number;
  // API Key Previews
  google_maps_api_key_preview?: string;
  razorpay_key_id_preview?: string;
  razorpay_key_secret_preview?: string;
  ekqr_api_key_preview?: string;
  gemini_api_key_preview?: string;
  gemini_enabled?: boolean;
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
            offline_enabled: true,
            razorpay_enabled: false,
            rewards_enabled: true,
            rewards_conversion_rate: 0.10,
            points_per_booking: 50,
            points_per_referral: 500,
            points_profile_complete: 100,
            min_redemption_points: 10,
            brand_name: 'StudySpace Platform',
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