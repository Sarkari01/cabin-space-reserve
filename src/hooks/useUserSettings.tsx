import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "@/hooks/use-toast";

export interface UserSettings {
  id: string;
  user_id: string;
  avatar_url?: string;
  bio?: string;
  location?: string;
  phone_verified: boolean;
  email_notifications: boolean;
  push_notifications: boolean;
  theme: 'light' | 'dark' | 'system';
  language: string;
  timezone: string;
  created_at: string;
  updated_at: string;
}

export const useUserSettings = () => {
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchSettings = async () => {
    if (!user) {
      setSettings(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("user_settings")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) {
        console.error("Error fetching user settings:", error);
        return;
      }

      // If no settings exist, create default ones
      if (!data) {
        await createDefaultSettings();
        return;
      }

      setSettings(data as UserSettings);
    } catch (error) {
      console.error("Unexpected error fetching user settings:", error);
    } finally {
      setLoading(false);
    }
  };

  const createDefaultSettings = async () => {
    if (!user) return;

    try {
      const defaultSettings = {
        user_id: user.id,
        email_notifications: true,
        push_notifications: true,
        theme: 'system' as const,
        language: 'en',
        timezone: 'UTC',
        phone_verified: false
      };

      const { data, error } = await supabase
        .from("user_settings")
        .insert(defaultSettings)
        .select()
        .single();

      if (error) {
        console.error("Error creating default settings:", error);
        return;
      }

      setSettings(data as UserSettings);
    } catch (error) {
      console.error("Unexpected error creating default settings:", error);
    }
  };

  const updateSettings = async (updates: Partial<UserSettings>) => {
    if (!user || !settings) return false;

    try {
      const { data, error } = await supabase
        .from("user_settings")
        .update(updates)
        .eq("user_id", user.id)
        .select()
        .single();

      if (error) {
        console.error("Error updating settings:", error);
        toast({
          title: "Error",
          description: "Failed to update settings",
          variant: "destructive"
        });
        return false;
      }

      setSettings(data as UserSettings);
      toast({
        title: "Success",
        description: "Settings updated successfully"
      });
      return true;
    } catch (error) {
      console.error("Unexpected error updating settings:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive"
      });
      return false;
    }
  };

  const updateAvatar = async (avatarUrl: string) => {
    return await updateSettings({ avatar_url: avatarUrl });
  };

  const updateNotificationPreferences = async (
    emailNotifications: boolean,
    pushNotifications: boolean
  ) => {
    return await updateSettings({
      email_notifications: emailNotifications,
      push_notifications: pushNotifications
    });
  };

  const updateTheme = async (theme: UserSettings['theme']) => {
    return await updateSettings({ theme });
  };

  useEffect(() => {
    fetchSettings();
  }, [user]);

  return {
    settings,
    loading,
    updateSettings,
    updateAvatar,
    updateNotificationPreferences,
    updateTheme,
    refetch: fetchSettings
  };
};