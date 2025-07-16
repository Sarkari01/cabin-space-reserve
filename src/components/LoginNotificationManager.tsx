import { PopupNotificationManager } from '@/components/PopupNotification';
import { useLoginNotifications } from '@/hooks/useLoginNotifications';

export function LoginNotificationManager() {
  const {
    notifications,
    handleNotificationShown,
    handleNotificationDismissed,
    handleNotificationClicked,
  } = useLoginNotifications();

  if (!notifications.length) {
    return null;
  }

  return (
    <PopupNotificationManager
      notifications={notifications}
      onNotificationShown={handleNotificationShown}
      onNotificationClicked={handleNotificationClicked}
      onNotificationDismissed={handleNotificationDismissed}
      defaultDuration={10}
    />
  );
}