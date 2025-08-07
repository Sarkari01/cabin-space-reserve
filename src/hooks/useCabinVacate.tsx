import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from './use-toast';

interface CabinAvailabilityStatus {
  is_available: boolean;
  status_reason: string;
  booked_until: string | null;
  booking_id: string | null;
  days_remaining: number;
}

export const useCabinVacate = () => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const vacateCabinBooking = async (bookingId: string, reason?: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('cabin-vacate', {
        body: {
          action: 'vacate',
          bookingId,
          reason
        }
      });

      if (error) {
        throw error;
      }

      if (!data.success) {
        throw new Error(data.error);
      }

      toast({
        title: "Cabin Vacated",
        description: "The cabin booking has been successfully vacated and is now available.",
      });

      return data;
    } catch (error) {
      console.error('Error vacating cabin booking:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to vacate cabin booking",
        variant: "destructive",
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const autoExpireCabinBookings = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('cabin-vacate', {
        body: {
          action: 'auto-expire'
        }
      });

      if (error) {
        throw error;
      }

      if (!data.success) {
        throw new Error(data.error);
      }

      toast({
        title: "Auto-Expiration Complete",
        description: `${data.expired_count} expired cabin bookings have been processed.`,
      });

      return data;
    } catch (error) {
      console.error('Error auto-expiring cabin bookings:', error);
      // Only show toast for unexpected errors, not permission errors
      if (!error.message?.includes('Only admins can trigger auto-expiration')) {
        toast({
          title: "Error",
          description: error instanceof Error ? error.message : "Failed to auto-expire cabin bookings",
          variant: "destructive",
        });
      }
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const getCabinAvailabilityStatus = async (cabinId: string): Promise<CabinAvailabilityStatus | null> => {
    try {
      const { data, error } = await supabase.functions.invoke('cabin-vacate', {
        body: {
          action: 'get-status',
          cabinId
        }
      });

      if (error) {
        throw error;
      }

      if (!data.success) {
        throw new Error(data.error);
      }

      return data.status;
    } catch (error) {
      console.error('Error getting cabin availability status:', error);
      return null;
    }
  };

  return {
    loading,
    vacateCabinBooking,
    autoExpireCabinBookings,
    getCabinAvailabilityStatus
  };
};