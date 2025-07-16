import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface BrandSettings {
  brand_name: string | null;
  logo_url: string | null;
  favicon_url: string | null;
  tagline: string | null;
  website_url: string | null;
  support_email: string | null;
  support_phone: string | null;
  business_address: string | null;
  copyright_text: string | null;
}

export const useBrandSettings = () => {
  const [brandSettings, setBrandSettings] = useState<BrandSettings>({
    brand_name: "StudySpace Platform",
    logo_url: null,
    favicon_url: null,
    tagline: null,
    website_url: null,
    support_email: null,
    support_phone: null,
    business_address: null,
    copyright_text: null,
  });
  const [loading, setLoading] = useState(true);

  const fetchBrandSettings = async () => {
    try {
      const { data, error } = await supabase
        .from("business_settings")
        .select("brand_name, logo_url, favicon_url, tagline, website_url, support_email, support_phone, business_address, copyright_text")
        .maybeSingle();

      if (error) {
        console.error("Error fetching brand settings:", error);
        return;
      }

      if (data) {
        setBrandSettings({
          brand_name: data.brand_name || "StudySpace Platform",
          logo_url: data.logo_url,
          favicon_url: data.favicon_url,
          tagline: data.tagline,
          website_url: data.website_url,
          support_email: data.support_email,
          support_phone: data.support_phone,
          business_address: data.business_address,
          copyright_text: data.copyright_text,
        });
      }
    } catch (error) {
      console.error("Error in fetchBrandSettings:", error);
    } finally {
      setLoading(false);
    }
  };

  const updatePageTitle = (brandName: string) => {
    document.title = brandName;
    
    // Update meta tags
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', `${brandName} - Your Study Space Platform`);
    }

    const ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) {
      ogTitle.setAttribute('content', brandName);
    }

    const ogDescription = document.querySelector('meta[property="og:description"]');
    if (ogDescription) {
      ogDescription.setAttribute('content', `${brandName} - Your Study Space Platform`);
    }
  };

  const updateFavicon = (faviconUrl: string | null) => {
    if (faviconUrl) {
      let existingLink = document.querySelector('link[rel="icon"]') as HTMLLinkElement;
      if (!existingLink) {
        existingLink = document.createElement('link');
        existingLink.rel = 'icon';
        existingLink.type = 'image/x-icon';
        document.head.appendChild(existingLink);
      }
      existingLink.href = faviconUrl;
    }
  };

  useEffect(() => {
    fetchBrandSettings();

    // Set up real-time subscription for business_settings changes
    const channel = supabase
      .channel('brand-settings-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'business_settings'
        },
        (payload) => {
          console.log('Brand settings updated:', payload);
          
          const newData = payload.new as any;
          const updatedSettings = {
            brand_name: newData.brand_name || "StudySpace Platform",
            logo_url: newData.logo_url,
            favicon_url: newData.favicon_url,
            tagline: newData.tagline,
            website_url: newData.website_url,
            support_email: newData.support_email,
            support_phone: newData.support_phone,
            business_address: newData.business_address,
            copyright_text: newData.copyright_text,
          };
          
          setBrandSettings(updatedSettings);
          
          // Update page title and favicon in real-time
          updatePageTitle(updatedSettings.brand_name || "StudySpace Platform");
          updateFavicon(updatedSettings.favicon_url);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Update page title and favicon when brand settings change
  useEffect(() => {
    updatePageTitle(brandSettings.brand_name || "StudySpace Platform");
    updateFavicon(brandSettings.favicon_url);
  }, [brandSettings.brand_name, brandSettings.favicon_url]);

  return {
    brandSettings,
    loading,
    refetch: fetchBrandSettings,
  };
};