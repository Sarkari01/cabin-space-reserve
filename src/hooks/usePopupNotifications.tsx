import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
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
  const { user, userRole, loading } = useAuth();
  const [shownNotifications, setShownNotifications] = useState<Set<string>>(new Set());
  const [hasTriggeredLogin, setHasTriggeredLogin] = useState(false);

  // Get user role for targeting
  const getUserRole = useCallback(() => {
    if (!userRole) return 'student';
    return userRole === 'student' ? 'students' : 
           userRole === 'merchant' ? 'merchants' : 
           userRole;
  }, [userRole]);

  // Fetch active popup notifications for the current user (both general and login)
  const { data: notifications = [], refetch } = useQuery({
    queryKey: ['popup-notifications', user?.id, userRole, hasTriggeredLogin],
    queryFn: async () => {
      if (!user) return [];

      const userRoleForQuery = getUserRole();
      
      // Get both general notifications and login notifications
      const generalQuery = supabase.rpc('get_active_popup_notifications', {
        p_user_id: user.id,
        p_user_role: userRoleForQuery
      });
      
      // Get login notifications only if login was triggered
      let loginNotifications: PopupNotification[] = [];
      if (hasTriggeredLogin) {
        const { data: loginData, error: loginError } = await supabase
          .from('notifications')
          .select('*')
          .eq('popup_enabled', true)
          .eq('trigger_event', 'login')
          .in('target_audience', ['all_users', userRoleForQuery])
          .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)
          .or(`schedule_time.is.null,schedule_time.lte.${new Date().toISOString()}`)
          .order('priority', { ascending: false });

        if (!loginError && loginData) {
          loginNotifications = loginData.filter(notification => {
            const sessionKey = `login-notification-${notification.id}-${user.id}`;
            return !sessionStorage.getItem(sessionKey);
          });
        }
      }

      const { data: generalData, error: generalError } = await generalQuery;

      if (generalError) {
        console.error('Error fetching popup notifications:', generalError);
        return loginNotifications;
      }

      // Combine and deduplicate notifications
      const allNotifications = [...(generalData || []), ...loginNotifications];
      const uniqueNotifications = allNotifications.filter((notification, index, array) => 
        array.findIndex(n => n.id === notification.id) === index
      );

      return uniqueNotifications as PopupNotification[];
    },
    enabled: !!user && !loading,
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
      
      // Mark login notifications in session storage
      if (action === 'shown' || action === 'dismissed') {
        const sessionKey = `login-notification-${notificationId}-${user.id}`;
        sessionStorage.setItem(sessionKey, 'true');
      }
    },
    onError: (error) => {
      console.error('Error tracking notification interaction:', error);
    }
  });

  // Handle notification shown - stable with proper dependencies
  const handleNotificationShown = useCallback((notificationId: string) => {
    console.log('[POPUP] Showing notification:', notificationId);
    
    setShownNotifications(prev => {
      if (prev.has(notificationId)) {
        console.log('[POPUP] Already shown:', notificationId);
        return prev; // Prevent duplicate calls
      }
      console.log('[POPUP] Adding to shown set:', notificationId);
      return new Set([...prev, notificationId]);
    });
    
    trackInteractionMutation.mutate({
      notificationId,
      action: 'shown'
    });
  }, [trackInteractionMutation]);

  // Handle notification dismissed
  const handleNotificationDismissed = useCallback((notificationId: string) => {
    console.log('[POPUP] Dismissing notification:', notificationId);
    
    trackInteractionMutation.mutate({
      notificationId,
      action: 'dismissed'
    });
    
    // Refetch to get updated list
    // Use shorter delay and avoid unnecessary refetch if possible
    setTimeout(() => {
      console.log('[POPUP] Refetching after dismiss');
      refetch();
    }, 500);
  }, [trackInteractionMutation, refetch]);

  // Handle notification clicked
  const handleNotificationClicked = useCallback((notificationId: string) => {
    console.log('[POPUP] Clicking notification:', notificationId);
    
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

  // Trigger login notifications on user authentication
  useEffect(() => {
    if (user && !loading && !hasTriggeredLogin) {
      console.log('[POPUP] Triggering login notifications for user:', user.id);
      setHasTriggeredLogin(true);
    }
  }, [user, loading, hasTriggeredLogin]);

  // Reset on user change
  useEffect(() => {
    if (!user) {
      setHasTriggeredLogin(false);
      setShownNotifications(new Set());
    }
  }, [user]);

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