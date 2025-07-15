import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface RealTimeManagerProps {
  onBookingChange?: () => void;
  onSeatChange?: () => void;
  onTransactionChange?: () => void;
  onStudyHallChange?: () => void;
}

export function RealTimeManager({ 
  onBookingChange, 
  onSeatChange, 
  onTransactionChange, 
  onStudyHallChange 
}: RealTimeManagerProps) {
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    console.log("Setting up real-time subscriptions");
    
    const channels: any[] = [];

    // Booking changes
    if (onBookingChange) {
      const bookingChannel = supabase
        .channel('booking-updates')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'bookings'
          },
          (payload) => {
            console.log('Real-time booking change:', payload);
            onBookingChange();
          }
        )
        .subscribe();
      channels.push(bookingChannel);
    }

    // Seat availability changes
    if (onSeatChange) {
      const seatChannel = supabase
        .channel('seat-updates')
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'seats'
          },
          (payload) => {
            console.log('Real-time seat change:', payload);
            onSeatChange();
          }
        )
        .subscribe();
      channels.push(seatChannel);
    }

    // Transaction changes
    if (onTransactionChange) {
      const transactionChannel = supabase
        .channel('transaction-updates')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'transactions'
          },
          (payload) => {
            console.log('Real-time transaction change:', payload);
            onTransactionChange();
          }
        )
        .subscribe();
      channels.push(transactionChannel);
    }

    // Study hall changes
    if (onStudyHallChange) {
      const studyHallChannel = supabase
        .channel('studyhall-updates')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'study_halls'
          },
          (payload) => {
            console.log('Real-time study hall change:', payload);
            onStudyHallChange();
          }
        )
        .subscribe();
      channels.push(studyHallChannel);
    }

    return () => {
      console.log("Cleaning up real-time subscriptions");
      channels.forEach(channel => supabase.removeChannel(channel));
    };
  }, [user, onBookingChange, onSeatChange, onTransactionChange, onStudyHallChange]);

  return null; // This component doesn't render anything
}