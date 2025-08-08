import React from "react"
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Initialize brand settings early
import { supabase } from "@/integrations/supabase/client";

// Update initial meta tags based on business settings
const initializeBrandSettings = async () => {
  try {
    const { data, error } = await supabase
      .from("business_settings")
      .select("brand_name, favicon_url")
      .maybeSingle();

    if (data && !error) {
      // Update page title
      document.title = data.brand_name || "StudySpace Platform";
      
      // Update favicon if available
      if (data.favicon_url) {
        const link = document.querySelector("link[rel*='icon']") as HTMLLinkElement;
        if (link) {
          link.href = data.favicon_url;
        }
      }
    }
  } catch (error) {
    console.error("Error initializing brand settings:", error);
  }
};

// Initialize before rendering
initializeBrandSettings();

createRoot(document.getElementById("root")!).render(
  <App />
);
