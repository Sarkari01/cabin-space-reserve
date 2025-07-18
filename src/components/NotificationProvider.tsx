import React from 'react';
import { useBookingNotifications } from '@/hooks/useBookingNotifications';
import { useUserNotifications } from '@/hooks/useUserNotifications';

interface NotificationProviderProps {
  children: React.ReactNode;
}

export const NotificationProvider = ({ children }: NotificationProviderProps) => {
  // Initialize SMS notification listeners
  useBookingNotifications();
  useUserNotifications();

  return <>{children}</>;
};