import { usePopupNotifications } from '@/hooks/usePopupNotifications';
import { PopupNotificationManager } from '@/components/PopupNotification';

interface PopupNotificationProviderProps {
  children: React.ReactNode;
}

export function PopupNotificationProvider({ children }: PopupNotificationProviderProps) {
  const {
    notifications,
    handleNotificationShown,
    handleNotificationDismissed,
    handleNotificationClicked
  } = usePopupNotifications();

  return (
    <>
      {children}
      <PopupNotificationManager
        notifications={notifications}
        onNotificationShown={handleNotificationShown}
        onNotificationDismissed={handleNotificationDismissed}
        onNotificationClicked={handleNotificationClicked}
      />
    </>
  );
}