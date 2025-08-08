
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface BusinessSettings {
  id?: string;
  ekqr_enabled: boolean;
  offline_enabled: boolean;
  razorpay_enabled: boolean;
  gemini_enabled: boolean;
  logo_url?: string;
  favicon_url?: string;
  brand_name?: string;
  support_email?: string;
  support_phone?: string;
  website_url?: string;
  tagline?: string;
  business_address?: string;
  copyright_text?: string;
  trial_plan_enabled?: boolean;
  trial_duration_days?: number;
  trial_plan_name?: string;
  trial_max_study_halls?: number;
  platform_fee_percentage?: number;
  minimum_settlement_amount?: number;
  minimum_withdrawal_amount?: number;
  auto_approval_threshold?: number;
  withdrawal_processing_days?: number;
  rewards_enabled?: boolean;
  rewards_conversion_rate?: number;
  points_per_booking?: number;
  points_per_referral?: number;
  points_profile_complete?: number;
  min_redemption_points?: number;
  // Maintenance mode
  maintenance_mode_enabled?: boolean;
  maintenance_message?: string;
  maintenance_estimated_return?: string | null;
  maintenance_target_roles?: string[];
  // Platform fee (new)
  platform_fee_enabled?: boolean;
  platform_fee_type?: 'flat' | 'percent';
  platform_fee_value?: number;
  // API Key previews
  google_maps_api_key_preview?: string;
  razorpay_key_id_preview?: string;
  razorpay_key_secret_preview?: string;
  ekqr_api_key_preview?: string;
  gemini_api_key_preview?: string;
}

// Normalize raw DB object into our strict BusinessSettings type, especially platform_fee_type
const normalizeBusinessSettings = (raw: any): BusinessSettings => {
  if (!raw) return raw;
  const platform_fee_type: 'flat' | 'percent' =
    raw.platform_fee_type === 'flat' ? 'flat' : 'percent';
  return {
    ...raw,
    platform_fee_type,
  };
};

export const useBusinessSettings = () => {
  const [settings, setSettings] = useState<BusinessSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchSettings = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { data, error: fetchError } = await supabase
        .from('business_settings')
        .select('*')
        .maybeSingle();

      if (fetchError) {
        throw fetchError;
      }

      if (data) {
        setSettings(normalizeBusinessSettings(data));
      } else {
        // Create default settings if none exist
        const defaultSettings: Partial<BusinessSettings> = {
          ekqr_enabled: true,
          offline_enabled: true,
          razorpay_enabled: false,
          gemini_enabled: false,
          brand_name: 'StudySpace Platform',
          trial_plan_enabled: false,
          trial_duration_days: 14,
          trial_plan_name: 'Free Trial',
          trial_max_study_halls: 1,
          platform_fee_percentage: 10.00,
          minimum_settlement_amount: 100.00,
          minimum_withdrawal_amount: 500.00,
          auto_approval_threshold: 10000.00,
          withdrawal_processing_days: 3,
          rewards_enabled: true,
          rewards_conversion_rate: 0.10,
          points_per_booking: 50,
          points_per_referral: 500,
          points_profile_complete: 100,
          min_redemption_points: 10,
          maintenance_mode_enabled: false,
          maintenance_message: 'We are currently performing maintenance. Please check back later.',
          maintenance_estimated_return: null,
          maintenance_target_roles: ['merchant', 'student', 'incharge', 'telemarketing_executive', 'pending_payments_caller', 'customer_care_executive', 'settlement_manager', 'general_administrator', 'institution'],
          // New platform fee defaults
          platform_fee_enabled: false,
          platform_fee_type: 'percent',
          platform_fee_value: 0,
        };

        const { data: newData, error: createError } = await supabase
          .from('business_settings')
          .insert(defaultSettings)
          .select()
          .single();

        if (createError) {
          throw createError;
        }

        setSettings(normalizeBusinessSettings(newData));
      }
    } catch (err) {
      console.error('Error fetching business settings:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch business settings');
      toast({
        title: "Error",
        description: "Failed to load business settings",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateSettings = async (newSettings: Partial<BusinessSettings>): Promise<boolean> => {
    try {
      setError(null);
      
      // Validation
      if (newSettings.support_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newSettings.support_email)) {
        throw new Error('Invalid email format');
      }
      
      if (newSettings.support_phone && !/^[\+]?[\d\s\-\(\)]{10,}$/.test(newSettings.support_phone)) {
        throw new Error('Invalid phone number format');
      }
      
      if (newSettings.website_url) {
        try {
          new URL(newSettings.website_url);
        } catch {
          throw new Error('Invalid website URL format');
        }
      }

      // Validate numeric fields
      if (newSettings.platform_fee_percentage !== undefined && 
          (newSettings.platform_fee_percentage < 0 || newSettings.platform_fee_percentage > 100)) {
        throw new Error('Platform fee percentage must be between 0 and 100');
      }

      if (newSettings.trial_duration_days !== undefined && newSettings.trial_duration_days < 1) {
        throw new Error('Trial duration must be at least 1 day');
      }

      if (newSettings.trial_max_study_halls !== undefined && newSettings.trial_max_study_halls < 1) {
        throw new Error('Trial max study halls must be at least 1');
      }

      // New: platform fee validations
      if (newSettings.platform_fee_enabled) {
        if (newSettings.platform_fee_value !== undefined && newSettings.platform_fee_value < 0) {
          throw new Error('Platform fee value must be >= 0');
        }
        if (newSettings.platform_fee_type === 'percent') {
          const v = newSettings.platform_fee_value ?? settings?.platform_fee_value ?? 0;
          if (v < 0 || v > 100) {
            throw new Error('When type is percent, fee value must be between 0 and 100');
          }
        }
        if (newSettings.platform_fee_type && !['flat', 'percent'].includes(newSettings.platform_fee_type)) {
          throw new Error('Invalid platform fee type');
        }
      }

      const { data, error: updateError } = await supabase
        .from('business_settings')
        .update({
          ...newSettings,
          updated_at: new Date().toISOString()
        })
        .eq('id', settings?.id)
        .select()
        .single();

      if (updateError) {
        throw updateError;
      }

      setSettings(normalizeBusinessSettings(data));
      return true;
    } catch (err) {
      console.error('Error updating business settings:', err);
      setError(err instanceof Error ? err.message : 'Failed to update business settings');
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to update settings",
        variant: "destructive",
      });
      return false;
    }
  };

  const refreshSettings = async () => {
    await fetchSettings();
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  // Set up real-time subscription for business settings changes
  useEffect(() => {
    if (!settings?.id) return;

    const subscription = supabase
      .channel('business_settings_changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'business_settings',
          filter: `id=eq.${settings.id}`
        },
        (payload) => {
          console.log('Business settings updated:', payload);
          setSettings(normalizeBusinessSettings(payload.new as any));
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [settings?.id]);

  return {
    settings,
    loading,
    error,
    updateSettings,
    refreshSettings,
    fetchSettings
  };
};
