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

export function usePopupNotifications() {
  const { user, userRole, loading } = useAuth();
  const [shownNotifications, setShownNotifications] = useState<Set<string>>(new Set());

  console.log('[usePopupNotifications] Hook state:', { 
    userId: user?.id, 
    userRole,
    shownCount: shownNotifications.size 
  });

  // Get user role for targeting
  const getUserRole = useCallback(() => {
    return userRole || 'student';
  }, [userRole]);

  // Query for notifications with enhanced debugging
  const { data: notifications = [], isError, error, refetch } = useQuery({
    queryKey: ['popup-notifications', user?.id, userRole],
    queryFn: async () => {
      console.log('[usePopupNotifications] Starting fetch with:', {
        hasUser: !!user,
        userId: user?.id,
        userRole,
        loading
      });

      if (!user) {
        console.log('[usePopupNotifications] No user, skipping query');
        return [];
      }

      try {
        const userRoleForQuery = getUserRole();
        console.log('[usePopupNotifications] Calling RPC with:', {
          p_user_id: user.id,
          p_user_role: userRoleForQuery
        });
        
        // Get notifications from RPC
        const { data: generalData, error: generalError } = await supabase.rpc('get_active_popup_notifications', {
          p_user_id: user.id,
          p_user_role: userRoleForQuery
        });

        if (generalError) {
          console.error('[usePopupNotifications] RPC error:', generalError);
          throw generalError;
        }

        const allNotifications: PopupNotification[] = generalData || [];

        console.log('[usePopupNotifications] Query completed:', {
          count: allNotifications.length,
          notifications: allNotifications.map(n => ({
            id: n.id,
            title: n.title,
            priority: n.priority
          }))
        });
        
        return allNotifications;
      } catch (error) {
        console.error('[usePopupNotifications] Query error:', error);
        throw error;
      }
    },
    enabled: !!user && !loading,
    staleTime: 0, // Always fetch fresh
    gcTime: 0, // Don't cache
    retry: false, // Show errors immediately
    refetchOnWindowFocus: false,
    refetchOnMount: true,
  });

  // Log query state
  useEffect(() => {
    console.log('[usePopupNotifications] Query state:', {
      notificationCount: notifications.length,
      isError,
      error: error?.message,
      enabled: !!user && !loading
    });
  }, [notifications.length, isError, error, user, loading]);

  // Simplified mutation for tracking interactions
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

  // Reset shown notifications and refetch on every login
  useEffect(() => {
    if (user && userRole && !loading) {
      console.log('[usePopupNotifications] User authenticated, clearing shown notifications and refetching');
      setShownNotifications(new Set()); // Clear shown notifications on every login
      refetch();
    }
  }, [user, userRole, loading, refetch]);

  // Reset on user logout
  useEffect(() => {
    if (!user) {
      console.log('[usePopupNotifications] User logged out, resetting state');
      setShownNotifications(new Set());
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

  console.log('[usePopupNotifications] Final notifications:', {
    total: notifications.length,
    shown: shownNotifications.size,
    pending: pendingNotifications.length,
    sorted: sortedNotifications.length,
    finalList: sortedNotifications.map(n => ({ id: n.id, title: n.title }))
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