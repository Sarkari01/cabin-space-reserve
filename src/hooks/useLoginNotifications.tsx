import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface LoginNotification {
  id: string;
  title: string;
  message: string;
  image_url?: string;
  button_text?: string;
  button_url?: string;
  duration_seconds: number;
  priority: number;
  target_audience: string;
  created_at: string;
}

interface LoginNotificationHook {
  notifications: LoginNotification[];
  hasNotifications: boolean;
  handleNotificationShown: (notificationId: string) => void;
  handleNotificationDismissed: (notificationId: string) => void;
  handleNotificationClicked: (notificationId: string) => void;
}

export function useLoginNotifications(): LoginNotificationHook {
  const { user, userRole, loading } = useAuth();
  const [hasTriggeredLogin, setHasTriggeredLogin] = useState(false);
  const [shownNotifications, setShownNotifications] = useState<Set<string>>(new Set());

  // Get user role mapping for target audience
  const getUserRole = (): string => {
    if (!userRole) return 'student';
    return userRole === 'student' ? 'students' : 
           userRole === 'merchant' ? 'merchants' : 
           userRole;
  };

  // Fetch login notifications
  const { data: notifications = [], refetch } = useQuery({
    queryKey: ['login-notifications', user?.id, userRole],
    queryFn: async () => {
      const userRoleForQuery = getUserRole();
      
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('popup_enabled', true)
        .eq('trigger_event', 'login')
        .in('target_audience', ['all_users', userRoleForQuery])
        .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)
        .or(`schedule_time.is.null,schedule_time.lte.${new Date().toISOString()}`)
        .order('priority', { ascending: false });

      if (error) throw error;
      
      return (data as LoginNotification[]).filter(notification => {
        // Check if user has already interacted with this notification in this session
        const sessionKey = `login-notification-${notification.id}-${user?.id}`;
        return !sessionStorage.getItem(sessionKey);
      });
    },
    enabled: !!user && !loading && hasTriggeredLogin,
  });

  // Track notification interaction
  const trackInteractionMutation = useMutation({
    mutationFn: async ({
      notificationId,
      action
    }: {
      notificationId: string;
      action: 'shown' | 'dismissed' | 'clicked';
    }) => {
      if (!user) return;

      // Track in popup_user_interactions table
      const interactionData: any = {
        notification_id: notificationId,
        user_id: user.id,
      };

      if (action === 'shown') {
        interactionData.shown_at = new Date().toISOString();
      } else if (action === 'dismissed') {
        interactionData.dismissed_at = new Date().toISOString();
      } else if (action === 'clicked') {
        interactionData.clicked_at = new Date().toISOString();
      }

      const { error: interactionError } = await supabase
        .from('popup_user_interactions')
        .upsert(interactionData, {
          onConflict: 'notification_id,user_id'
        });

      if (interactionError) throw interactionError;

      // Update notification stats
      if (action === 'shown') {
        // Get current count and increment
        const { data: currentData } = await supabase
          .from('notifications')
          .select('shown_count')
          .eq('id', notificationId)
          .single();
        
        if (currentData) {
          await supabase
            .from('notifications')
            .update({ shown_count: (currentData.shown_count || 0) + 1 })
            .eq('id', notificationId);
        }
      } else if (action === 'clicked') {
        // Get current count and increment
        const { data: currentData } = await supabase
          .from('notifications')
          .select('click_count')
          .eq('id', notificationId)
          .single();
        
        if (currentData) {
          await supabase
            .from('notifications')
            .update({ click_count: (currentData.click_count || 0) + 1 })
            .eq('id', notificationId);
        }
      }

      // Mark as shown in session storage
      const sessionKey = `login-notification-${notificationId}-${user.id}`;
      sessionStorage.setItem(sessionKey, 'true');
    },
    onError: (error) => {
      console.error('Error tracking login notification interaction:', error);
    }
  });

  // Handle notification shown
  const handleNotificationShown = (notificationId: string) => {
    if (shownNotifications.has(notificationId)) return;
    
    setShownNotifications(prev => new Set([...prev, notificationId]));
    trackInteractionMutation.mutate({
      notificationId,
      action: 'shown'
    });
  };

  // Handle notification dismissed
  const handleNotificationDismissed = (notificationId: string) => {
    trackInteractionMutation.mutate({
      notificationId,
      action: 'dismissed'
    });
    
    // Refetch to update the list
    setTimeout(() => refetch(), 1000);
  };

  // Handle notification clicked
  const handleNotificationClicked = (notificationId: string) => {
    trackInteractionMutation.mutate({
      notificationId,
      action: 'clicked'
    });
  };

  // Trigger login notifications on user authentication
  useEffect(() => {
    if (user && !loading && !hasTriggeredLogin) {
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

  return {
    notifications,
    hasNotifications: notifications.length > 0,
    handleNotificationShown,
    handleNotificationDismissed,
    handleNotificationClicked,
  };
}