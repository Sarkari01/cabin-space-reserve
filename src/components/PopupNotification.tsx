import { useEffect, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { AlertDialog, AlertDialogContent, AlertDialogFooter } from '@/components/ui/alert-dialog';
import { X, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PopupNotificationProps {
  id: string;
  title: string;
  message: string;
  imageUrl?: string;
  buttonText?: string;
  buttonUrl?: string;
  isOpen: boolean;
  onClose: () => void;
  onButtonClick?: () => void;
  autoClose?: number; // Auto close after X seconds
}

export function PopupNotification({
  id,
  title,
  message,
  imageUrl,
  buttonText,
  buttonUrl,
  isOpen,
  onClose,
  onButtonClick,
  autoClose
}: PopupNotificationProps) {
  const [countdown, setCountdown] = useState<number | null>(null);

  // Auto close functionality
  useEffect(() => {
    if (isOpen && autoClose) {
      setCountdown(autoClose);
      const interval = setInterval(() => {
        setCountdown((prev) => {
          if (prev && prev <= 1) {
            onClose();
            return null;
          }
          return prev ? prev - 1 : null;
        });
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [isOpen, autoClose, onClose]);

  const handleButtonClick = () => {
    if (buttonUrl) {
      if (buttonUrl.startsWith('/')) {
        // Internal navigation
        window.location.href = buttonUrl;
      } else {
        // External link
        window.open(buttonUrl, '_blank');
      }
    }
    onButtonClick?.();
    onClose();
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent className="max-w-md p-0 gap-0 overflow-hidden">
        {/* Header with close button */}
        <div className="relative">
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="absolute top-2 right-2 z-10 h-8 w-8 p-0 rounded-full bg-background/80 hover:bg-background"
          >
            <X className="h-4 w-4" />
          </Button>
          
          {/* Auto close countdown */}
          {countdown && countdown > 0 && (
            <div className="absolute top-2 left-2 z-10 bg-background/80 rounded-full px-2 py-1 text-xs">
              {countdown}s
            </div>
          )}
        </div>

        {/* Image */}
        {imageUrl && (
          <div className="w-full h-48 overflow-hidden">
            <img
              src={imageUrl}
              alt="Notification"
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {/* Content */}
        <CardContent className="p-6 space-y-4">
          {/* Title */}
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
            <h3 className="font-semibold text-lg leading-tight">{title}</h3>
          </div>

          {/* Message */}
          <p className="text-muted-foreground leading-relaxed">{message}</p>

          {/* Action Button */}
          {buttonText && (
            <div className="pt-2">
              <Button
                onClick={handleButtonClick}
                className="w-full gap-2"
                size="lg"
              >
                {buttonText}
                {buttonUrl && !buttonUrl.startsWith('/') && (
                  <ExternalLink className="h-4 w-4" />
                )}
              </Button>
            </div>
          )}
        </CardContent>

      </AlertDialogContent>
    </AlertDialog>
  );
}

// Queue management component for multiple notifications
interface PopupNotificationData {
  id: string;
  title: string;
  message: string;
  image_url?: string;
  button_text?: string;
  button_url?: string;
  priority: number;
  duration_seconds?: number;
}

interface PopupNotificationManagerProps {
  notifications: PopupNotificationData[];
  onNotificationShown: (id: string) => void;
  onNotificationClicked: (id: string) => void;
  onNotificationDismissed: (id: string) => void;
  defaultDuration?: number;
}

export function PopupNotificationManager({
  notifications,
  onNotificationShown,
  onNotificationClicked,
  onNotificationDismissed,
  defaultDuration = 10
}: PopupNotificationManagerProps) {
  const [currentNotificationIndex, setCurrentNotificationIndex] = useState(0);
  const [sessionShown, setSessionShown] = useState<Set<string>>(new Set());

  console.log('[PopupNotificationManager] RENDER STATE:', { 
    totalNotifications: notifications.length, 
    currentIndex: currentNotificationIndex,
    sessionShownCount: sessionShown.size,
    currentNotification: notifications[currentNotificationIndex] ? {
      id: notifications[currentNotificationIndex].id,
      title: notifications[currentNotificationIndex].title
    } : null
  });

  // Reset index when new notifications arrive
  useEffect(() => {
    if (notifications.length > 0) {
      console.log('[PopupNotificationManager] New notifications available, starting from index 0');
      setCurrentNotificationIndex(0);
      // DON'T reset sessionShown - let notifications show in sequence
    }
  }, [notifications]);

  // Track shown notifications and call callback
  const markAsShown = useCallback((notificationId: string) => {
    if (!sessionShown.has(notificationId)) {
      console.log('[PopupNotificationManager] First time showing notification:', notificationId);
      setSessionShown(prev => new Set([...prev, notificationId]));
      onNotificationShown(notificationId);
    }
  }, [sessionShown, onNotificationShown]);

  const handleClose = useCallback(() => {
    const currentNotification = notifications[currentNotificationIndex];
    if (currentNotification) {
      console.log('[PopupNotificationManager] Closing notification:', currentNotification.id);
      onNotificationDismissed(currentNotification.id);
    }
    
    // Move to next notification
    setCurrentNotificationIndex(prev => prev + 1);
  }, [notifications, currentNotificationIndex, onNotificationDismissed]);

  const handleButtonClick = useCallback(() => {
    const currentNotification = notifications[currentNotificationIndex];
    if (currentNotification) {
      console.log('[PopupNotificationManager] Button clicked for notification:', currentNotification.id);
      onNotificationClicked(currentNotification.id);
    }
  }, [notifications, currentNotificationIndex, onNotificationClicked]);

  // Check if we have any notifications to show
  if (!notifications.length) {
    console.log('[PopupNotificationManager] No notifications available');
    return null;
  }

  if (currentNotificationIndex >= notifications.length) {
    console.log('[PopupNotificationManager] All notifications shown');
    return null;
  }

  const currentNotification = notifications[currentNotificationIndex];
  if (!currentNotification) {
    console.log('[PopupNotificationManager] Current notification is null');
    return null;
  }

  // Show notification immediately when available, track after render
  const shouldShow = true; // ALWAYS show available notifications
  
  // Mark as shown after a brief delay to avoid render loops
  useEffect(() => {
    if (currentNotification && shouldShow) {
      const timer = setTimeout(() => {
        markAsShown(currentNotification.id);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [currentNotification?.id, shouldShow, markAsShown]);

  console.log('[PopupNotificationManager] SHOWING NOTIFICATION:', { 
    notificationId: currentNotification.id,
    title: currentNotification.title,
    shouldShow,
    currentIndex: currentNotificationIndex
  });

  return (
    <PopupNotification
      id={currentNotification.id}
      title={currentNotification.title}
      message={currentNotification.message}
      imageUrl={currentNotification.image_url}
      buttonText={currentNotification.button_text}
      buttonUrl={currentNotification.button_url}
      isOpen={shouldShow}
      onClose={handleClose}
      onButtonClick={handleButtonClick}
      autoClose={currentNotification.duration_seconds || defaultDuration}
    />
  );
}