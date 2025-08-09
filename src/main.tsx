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
      .rpc("get_public_business_settings");

    if (data && !error) {
      const d = data as any;
      document.title = d.brand_name || "StudySpace Platform";
      if (d.favicon_url) {
        const link = document.querySelector("link[rel*='icon']") as HTMLLinkElement;
        if (link) {
          link.href = d.favicon_url;
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
