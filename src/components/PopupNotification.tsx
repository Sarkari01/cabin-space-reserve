import { useEffect, useState } from 'react';
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

        {/* Footer with dismiss option */}
        <div className="px-6 pb-4">
          <Button
            variant="ghost"
            onClick={onClose}
            className="w-full text-sm text-muted-foreground hover:text-foreground"
          >
            Dismiss
          </Button>
        </div>
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
}

interface PopupNotificationManagerProps {
  notifications: PopupNotificationData[];
  onNotificationShown: (id: string) => void;
  onNotificationClicked: (id: string) => void;
  onNotificationDismissed: (id: string) => void;
}

export function PopupNotificationManager({
  notifications,
  onNotificationShown,
  onNotificationClicked,
  onNotificationDismissed
}: PopupNotificationManagerProps) {
  const [currentNotificationIndex, setCurrentNotificationIndex] = useState(0);
  const [isShowing, setIsShowing] = useState(false);
  const [shownIds, setShownIds] = useState<Set<string>>(new Set());

  // Show notifications one at a time - prevent infinite loop by tracking shown IDs
  useEffect(() => {
    if (notifications.length > 0 && currentNotificationIndex < notifications.length && !isShowing) {
      const currentNotification = notifications[currentNotificationIndex];
      
      // Only show if we haven't already called onNotificationShown for this ID
      if (!shownIds.has(currentNotification.id)) {
        setIsShowing(true);
        setShownIds(prev => new Set([...prev, currentNotification.id]));
        onNotificationShown(currentNotification.id);
      }
    }
  }, [notifications, currentNotificationIndex, isShowing]);

  const handleClose = () => {
    const currentNotification = notifications[currentNotificationIndex];
    if (currentNotification) {
      onNotificationDismissed(currentNotification.id);
    }
    setIsShowing(false);
    setCurrentNotificationIndex(prev => prev + 1);
  };

  const handleButtonClick = () => {
    const currentNotification = notifications[currentNotificationIndex];
    if (currentNotification) {
      onNotificationClicked(currentNotification.id);
    }
  };

  if (!notifications.length || currentNotificationIndex >= notifications.length) {
    return null;
  }

  const currentNotification = notifications[currentNotificationIndex];

  return (
    <PopupNotification
      id={currentNotification.id}
      title={currentNotification.title}
      message={currentNotification.message}
      imageUrl={currentNotification.image_url}
      buttonText={currentNotification.button_text}
      buttonUrl={currentNotification.button_url}
      isOpen={isShowing}
      onClose={handleClose}
      onButtonClick={handleButtonClick}
      autoClose={10} // Auto close after 10 seconds
    />
  );
}