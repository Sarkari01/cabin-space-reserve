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
  duration_seconds?: number;
}

interface PopupUserInteraction {
  notification_id: string;
  user_id: string;
  shown_at: string;
  dismissed_at?: string;
  clicked_at?: string;
}

// Global state to prevent concurrent processing
let isProcessingNotifications = false;

export function usePopupNotifications() {
  const { user, userRole, loading } = useAuth();
  const [shownNotifications, setShownNotifications] = useState<Set<string>>(new Set());
  const [hasTriggeredLogin, setHasTriggeredLogin] = useState(false);

  console.log('[usePopupNotifications] Hook state:', { 
    userId: user?.id, 
    userRole,
    hasTriggeredLogin,
    shownCount: shownNotifications.size 
  });

  // Get user role for targeting
  const getUserRole = useCallback(() => {
    if (!userRole) return 'student';
    return userRole === 'student' ? 'students' : 
           userRole === 'merchant' ? 'merchants' : 
           userRole;
  }, [userRole]);

  // Simplified query without real-time subscription to prevent cascade
  const { data: notifications = [], refetch } = useQuery({
    queryKey: ['popup-notifications', user?.id, userRole],
    queryFn: async () => {
      if (!user || isProcessingNotifications) {
        console.log('[usePopupNotifications] Skipping query - no user or processing');
        return [];
      }

      console.log('[usePopupNotifications] Fetching notifications');
      isProcessingNotifications = true;

      try {
        const userRoleForQuery = getUserRole();
        
        // Get general notifications from RPC
        const { data: generalData, error: generalError } = await supabase.rpc('get_active_popup_notifications', {
          p_user_id: user.id,
          p_user_role: userRoleForQuery
        });

        if (generalError) {
          console.error('[usePopupNotifications] Error fetching notifications:', generalError);
          return [];
        }

        let allNotifications: PopupNotification[] = generalData || [];

        // Get login notifications if triggered and not already shown this session
        if (hasTriggeredLogin) {
          const loginSessionKey = `login-notifications-${user.id}`;
          const hasShownLoginNotifications = sessionStorage.getItem(loginSessionKey);
          
          if (!hasShownLoginNotifications) {
            console.log('[usePopupNotifications] Fetching login notifications');
            
            const { data: loginData, error: loginError } = await supabase
              .from('notifications')
              .select('id, title, message, image_url, button_text, button_url, priority, created_at, duration_seconds')
              .eq('popup_enabled', true)
              .eq('trigger_event', 'login')
              .in('target_audience', ['all_users', userRoleForQuery])
              .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)
              .or(`schedule_time.is.null,schedule_time.lte.${new Date().toISOString()}`)
              .order('priority', { ascending: false });

            if (!loginError && loginData) {
              // Filter out already dismissed login notifications
              const filteredLoginNotifications = loginData.filter(notification => {
                // Check if dismissed
                const dismissedKey = `dismissed-login-${notification.id}-${user.id}`;
                return !sessionStorage.getItem(dismissedKey);
              });
              
              allNotifications = [...allNotifications, ...filteredLoginNotifications];
              
              // Mark that we've fetched login notifications this session
              sessionStorage.setItem(loginSessionKey, 'true');
            }
          }
        }

        // Deduplicate
        const uniqueNotifications = allNotifications.filter((notification, index, array) => 
          array.findIndex(n => n.id === notification.id) === index
        );

        console.log('[usePopupNotifications] Returning notifications:', uniqueNotifications);
        return uniqueNotifications;
      } finally {
        isProcessingNotifications = false;
      }
    },
    enabled: !!user && !loading,
    staleTime: 60000, // 1 minute
    refetchOnWindowFocus: false,
    refetchOnMount: true,
  });

  // Simplified mutation without stats updates to prevent cascading
  const trackInteractionMutation = useMutation({
    mutationFn: async ({
      notificationId,
      action
    }: {
      notificationId: string;
      action: 'shown' | 'dismissed' | 'clicked';
    }) => {
      if (!user) return;

      console.log('[usePopupNotifications] Tracking interaction:', { notificationId, action });

      const updateData: any = {};
      
      if (action === 'dismissed') {
        updateData.dismissed_at = new Date().toISOString();
      } else if (action === 'clicked') {
        updateData.clicked_at = new Date().toISOString();
      }

      try {
        // Try to update existing interaction
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

          if (insertError) {
            console.error('[usePopupNotifications] Insert error:', insertError);
          }
        }
        
        // Store dismissal in session storage for login notifications
        if (action === 'dismissed') {
          const dismissedKey = `dismissed-login-${notificationId}-${user.id}`;
          sessionStorage.setItem(dismissedKey, 'true');
        }
      } catch (error) {
        console.error('[usePopupNotifications] Interaction tracking error:', error);
      }
    },
    onError: (error) => {
      console.error('[usePopupNotifications] Mutation error:', error);
    }
  });

  // Handle notification shown - stable with guards
  const handleNotificationShown = useCallback((notificationId: string) => {
    console.log('[usePopupNotifications] Showing notification:', notificationId);
    
    setShownNotifications(prev => {
      if (prev.has(notificationId)) {
        console.log('[usePopupNotifications] Already shown:', notificationId);
        return prev;
      }
      const newSet = new Set(prev);
      newSet.add(notificationId);
      return newSet;
    });
    
    // Use setTimeout to break potential synchronous loops
    setTimeout(() => {
      trackInteractionMutation.mutate({
        notificationId,
        action: 'shown'
      });
    }, 0);
  }, []);

  // Handle notification dismissed - no automatic refetch
  const handleNotificationDismissed = useCallback((notificationId: string) => {
    console.log('[usePopupNotifications] Dismissing notification:', notificationId);
    
    setTimeout(() => {
      trackInteractionMutation.mutate({
        notificationId,
        action: 'dismissed'
      });
    }, 0);
  }, []);

  // Handle notification clicked
  const handleNotificationClicked = useCallback((notificationId: string) => {
    console.log('[usePopupNotifications] Clicking notification:', notificationId);
    
    setTimeout(() => {
      trackInteractionMutation.mutate({
        notificationId,
        action: 'clicked'
      });
    }, 0);
  }, []);

  // Trigger login notifications on user authentication
  useEffect(() => {
    if (user && !loading && !hasTriggeredLogin) {
      console.log('[usePopupNotifications] Triggering login notifications for user:', user.id);
      setHasTriggeredLogin(true);
    }
  }, [user, loading, hasTriggeredLogin]);

  // Reset on user change
  useEffect(() => {
    if (!user) {
      setHasTriggeredLogin(false);
      setShownNotifications(new Set());
      // Clear session storage for this user
      const keys = Object.keys(sessionStorage).filter(key => 
        key.includes('login-notification') || key.includes('dismissed-login')
      );
      keys.forEach(key => sessionStorage.removeItem(key));
    }
  }, [user]);

  // Filter out notifications that have been shown
  const pendingNotifications = notifications.filter(
    notification => !shownNotifications.has(notification.id)
  );

  // Sort by priority and creation date
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