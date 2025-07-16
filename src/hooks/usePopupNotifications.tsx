import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface PopupNotification {
  id: string;
  title: string;
  message: string;
  image_url?: string;
  button_text?: string;
  button_url?: string;
  priority: number;
  created_at: string;
}

interface PopupUserInteraction {
  notification_id: string;
  user_id: string;
  shown_at: string;
  dismissed_at?: string;
  clicked_at?: string;
}

export function usePopupNotifications() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [shownNotifications, setShownNotifications] = useState<Set<string>>(new Set());

  // Get user role for targeting
  const getUserRole = useCallback(() => {
    if (!user) return 'student';
    // You might want to get this from a profile or user context
    return 'student'; // Default fallback
  }, [user]);

  // Fetch active popup notifications for the current user
  const { data: notifications = [], refetch } = useQuery({
    queryKey: ['popup-notifications', user?.id],
    queryFn: async () => {
      if (!user) return [];

      const userRole = getUserRole();
      
      const { data, error } = await supabase.rpc('get_active_popup_notifications', {
        p_user_id: user.id,
        p_user_role: userRole
      });

      if (error) {
        console.error('Error fetching popup notifications:', error);
        return [];
      }

      return data as PopupNotification[];
    },
    enabled: !!user,
    refetchInterval: 30000, // Refetch every 30 seconds for new notifications
  });

  // Track notification interaction mutation - stable reference
  const trackInteractionMutation = useMutation({
    mutationFn: async ({
      notificationId,
      action
    }: {
      notificationId: string;
      action: 'shown' | 'dismissed' | 'clicked';
    }) => {
      if (!user) return;

      const updateData: any = {};
      
      if (action === 'dismissed') {
        updateData.dismissed_at = new Date().toISOString();
      } else if (action === 'clicked') {
        updateData.clicked_at = new Date().toISOString();
      }

      // First try to update existing interaction
      const { error: updateError } = await supabase
        .from('popup_user_interactions')
        .update(updateData)
        .eq('notification_id', notificationId)
        .eq('user_id', user.id);

      // If no existing interaction, create new one
      if (updateError) {
        const insertData = {
          notification_id: notificationId,
          user_id: user.id,
          ...updateData
        };

        const { error: insertError } = await supabase
          .from('popup_user_interactions')
          .insert(insertData);

        if (insertError) throw insertError;
      }

      // Update notification stats by fetching current value and incrementing
      if (action === 'shown' || action === 'clicked') {
        const { data: currentNotification } = await supabase
          .from('notifications')
          .select('shown_count, click_count')
          .eq('id', notificationId)
          .single();

        if (currentNotification) {
          const updateData: any = {};
          if (action === 'shown') {
            updateData.shown_count = (currentNotification.shown_count || 0) + 1;
          } else if (action === 'clicked') {
            updateData.click_count = (currentNotification.click_count || 0) + 1;
          }

          await supabase
            .from('notifications')
            .update(updateData)
            .eq('id', notificationId);
        }
      }
    },
    onError: (error) => {
      console.error('Error tracking notification interaction:', error);
    }
  });

  // Handle notification shown - stable with proper dependencies
  const handleNotificationShown = useCallback((notificationId: string) => {
    setShownNotifications(prev => {
      if (prev.has(notificationId)) return prev; // Prevent duplicate calls
      return new Set([...prev, notificationId]);
    });
    
    trackInteractionMutation.mutate({
      notificationId,
      action: 'shown'
    });
  }, [trackInteractionMutation]);

  // Handle notification dismissed
  const handleNotificationDismissed = useCallback((notificationId: string) => {
    trackInteractionMutation.mutate({
      notificationId,
      action: 'dismissed'
    });
    
    // Refetch to get updated list
    setTimeout(() => refetch(), 1000);
  }, [trackInteractionMutation, refetch]);

  // Handle notification clicked
  const handleNotificationClicked = useCallback((notificationId: string) => {
    trackInteractionMutation.mutate({
      notificationId,
      action: 'clicked'
    });
  }, [trackInteractionMutation]);

  // Set up real-time subscription for new notifications
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('popup-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `popup_enabled=eq.true`
        },
        () => {
          // Refetch notifications when new ones are created
          refetch();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, refetch]);

  // Filter out notifications that have been dismissed or shown
  const pendingNotifications = notifications.filter(
    notification => !shownNotifications.has(notification.id)
  );

  // Sort by priority (highest first) and creation date
  const sortedNotifications = pendingNotifications.sort((a, b) => {
    if (a.priority !== b.priority) {
      return b.priority - a.priority;
    }
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  return {
    notifications: sortedNotifications,
    hasNotifications: sortedNotifications.length > 0,
    handleNotificationShown,
    handleNotificationDismissed,
    handleNotificationClicked,
    refetch
  };
}