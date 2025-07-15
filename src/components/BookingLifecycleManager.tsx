import { useEffect } from 'react';
import { useBookingAvailability } from '@/hooks/useBookingAvailability';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const BookingLifecycleManager = () => {
  const { releaseExpiredBookings } = useBookingAvailability();
  const { toast } = useToast();

  useEffect(() => {
    // Run lifecycle checks on component mount
    const runLifecycleChecks = async () => {
      try {
        console.log('Running booking lifecycle checks...');
        
        // Release expired bookings
        const { releasedCount } = await releaseExpiredBookings();
        
        if (releasedCount > 0) {
          console.log(`Released ${releasedCount} expired bookings`);
          
          // Show toast notification
          toast({
            title: "Bookings Updated",
            description: `${releasedCount} expired booking${releasedCount === 1 ? ' has' : 's have'} been completed automatically.`,
          });
        }
      } catch (error) {
        console.error('Error in lifecycle checks:', error);
      }
    };

    // Run immediately
    runLifecycleChecks();

    // Set up periodic checks every 5 minutes
    const interval = setInterval(runLifecycleChecks, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [releaseExpiredBookings, toast]);

  // Listen for real-time booking updates to trigger lifecycle checks
  useEffect(() => {
    const channel = supabase
      .channel('booking-lifecycle')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'bookings'
        },
        (payload) => {
          console.log('Booking change detected:', payload);
          // Trigger lifecycle checks when bookings are updated
          setTimeout(() => {
            releaseExpiredBookings();
          }, 1000);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [releaseExpiredBookings]);

  return null; // This is a headless component
};