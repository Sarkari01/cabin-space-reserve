import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface MaintenanceStatus {
  enabled: boolean;
  message: string;
  estimatedReturn: string | null;
  targetRoles: string[] | null;
}

export const useMaintenanceMode = () => {
  const [maintenanceStatus, setMaintenanceStatus] = useState<MaintenanceStatus>({
    enabled: false,
    message: 'We are currently performing maintenance. Please check back later.',
    estimatedReturn: null,
    targetRoles: null
  });
  const [loading, setLoading] = useState(true);

  const fetchMaintenanceStatus = async () => {
    try {
      const { data, error } = await supabase
        .from('business_settings')
        .select('maintenance_mode_enabled, maintenance_message, maintenance_estimated_return, maintenance_target_roles')
        .maybeSingle();

      if (error) {
        console.error('Error fetching maintenance status:', error);
        return;
      }

      if (data) {
        setMaintenanceStatus({
          enabled: data.maintenance_mode_enabled || false,
          message: data.maintenance_message || 'We are currently performing maintenance. Please check back later.',
          estimatedReturn: data.maintenance_estimated_return,
          targetRoles: data.maintenance_target_roles || null
        });
      }
    } catch (err) {
      console.error('Error fetching maintenance status:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMaintenanceStatus();

    // Set up real-time subscription for maintenance mode changes
    const subscription = supabase
      .channel('maintenance_mode_changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'business_settings'
        },
        (payload) => {
          const newData = payload.new as any;
          setMaintenanceStatus({
            enabled: newData.maintenance_mode_enabled || false,
            message: newData.maintenance_message || 'We are currently performing maintenance. Please check back later.',
            estimatedReturn: newData.maintenance_estimated_return,
            targetRoles: newData.maintenance_target_roles || null
          });
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return {
    maintenanceStatus,
    loading,
    refreshStatus: fetchMaintenanceStatus
  };
};