
import { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";

interface BrandSettings {
  brand_name?: string;
  support_email?: string;
  support_phone?: string;
  logo_url?: string;
  copyright_text?: string;
  business_address?: string;
  social_facebook?: string;
  social_twitter?: string;
  social_instagram?: string;
  social_linkedin?: string;
  newsletter_enabled?: boolean;
  newsletter_description?: string;
  tagline?: string;
}

export const useBrandSettings = () => {
  const [brandSettings, setBrandSettings] = useState<BrandSettings>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBrandSettings = async () => {
      try {
        const { data, error } = await supabase
          .from('business_settings')
          .select('brand_name, support_email, support_phone, logo_url, copyright_text, business_address, social_facebook, social_twitter, social_instagram, social_linkedin, newsletter_enabled, newsletter_description, tagline')
          .single();

        if (error) {
          console.error('Error fetching brand settings:', error);
        } else {
          setBrandSettings(data || {});
        }
      } catch (error) {
        console.error('Error fetching brand settings:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchBrandSettings();
  }, []);

  return { brandSettings, loading };
};
