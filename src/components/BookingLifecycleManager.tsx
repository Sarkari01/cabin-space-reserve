import { useEffect } from 'react';
import { useBookingAvailability } from '@/hooks/useBookingAvailability';
import { useCabinVacate } from '@/hooks/useCabinVacate';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const BookingLifecycleManager = () => {
  const { releaseExpiredBookings } = useBookingAvailability();
  const { autoExpireCabinBookings } = useCabinVacate();
  const { userRole } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    // Run lifecycle checks on component mount
    const runLifecycleChecks = async () => {
      try {
        console.log('Running booking lifecycle checks...');
        
        // Release expired study hall bookings
        const { releasedCount } = await releaseExpiredBookings();
        
        // Auto-expire cabin bookings (admin only)
        let expiredCabinCount = 0;
        if (userRole === 'admin') {
          const cabinResult = await autoExpireCabinBookings();
          expiredCabinCount = cabinResult?.expired_count || 0;
        }
        
        const totalUpdated = releasedCount + expiredCabinCount;
        
        if (totalUpdated > 0) {
          console.log(`Released ${releasedCount} study hall bookings and ${expiredCabinCount} cabin bookings`);
          
          // Show toast notification
          toast({
            title: "Bookings Updated",
            description: `${totalUpdated} expired booking${totalUpdated === 1 ? ' has' : 's have'} been completed automatically.`,
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
  }, [releaseExpiredBookings, autoExpireCabinBookings, userRole, toast]);

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
          console.log('Study hall booking change detected:', payload);
          // Trigger lifecycle checks when bookings are updated
          setTimeout(() => {
            releaseExpiredBookings();
          }, 1000);
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'cabin_bookings'
        },
        (payload) => {
          console.log('Cabin booking change detected:', payload);
          // Trigger lifecycle checks when cabin bookings are updated (admin only)
          if (userRole === 'admin') {
            setTimeout(() => {
              autoExpireCabinBookings();
            }, 1000);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [releaseExpiredBookings, autoExpireCabinBookings, userRole]);

  return null; // This is a headless component
};