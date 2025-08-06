import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

export interface CabinBookingRequest {
  cabin_id: string;
  private_hall_id: string;
  start_date: string;
  end_date: string;
  months_booked: number;
  monthly_amount: number;
  total_amount: number;
}

export const useCabinBooking = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  const createBooking = useCallback(async (bookingData: CabinBookingRequest) => {
    if (!user) {
      throw new Error('User must be authenticated to create booking');
    }

    setLoading(true);
    setError(null);

    try {
      console.log('Creating cabin booking:', bookingData);

      // Use the secure database function
      const { data: result, error } = await supabase.rpc('create_cabin_booking', {
        p_cabin_id: bookingData.cabin_id,
        p_private_hall_id: bookingData.private_hall_id,
        p_start_date: bookingData.start_date,
        p_end_date: bookingData.end_date,
        p_months_booked: bookingData.months_booked,
        p_monthly_amount: bookingData.monthly_amount,
        p_total_amount: bookingData.total_amount,
        p_guest_name: null,
        p_guest_phone: null,
        p_guest_email: null
      });

      if (error || !(result as any)?.success) {
        const errorMessage = (result as any)?.error || error?.message || 'Failed to create booking';
        console.error('Booking creation failed:', errorMessage);
        throw new Error(errorMessage);
      }

      const bookingId = (result as any).booking_id;
      console.log('Booking created successfully:', bookingId);

      return bookingId;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      console.error('Error creating booking:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [user]);

  const processPayment = useCallback(async (bookingId: string, amount: number) => {
    setLoading(true);
    setError(null);

    try {
      console.log('Processing payment for booking:', bookingId, 'Amount:', amount);

      // Create payment order
      const { data: orderData, error: orderError } = await supabase.functions.invoke('cabin-booking-payment', {
        body: {
          action: 'create',
          bookingId,
          amount
        }
      });

      if (orderError || !orderData?.orderId) {
        throw new Error(orderError?.message || 'Failed to create payment order');
      }

      return orderData;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Payment processing failed';
      setError(errorMessage);
      console.error('Error processing payment:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const verifyPayment = useCallback(async (bookingId: string, paymentResponse: any) => {
    setLoading(true);
    setError(null);

    try {
      console.log('Verifying payment for booking:', bookingId);

      const { data, error } = await supabase.functions.invoke('cabin-booking-payment', {
        body: {
          action: 'verify',
          bookingId,
          paymentResponse
        }
      });

      if (error || !data?.success) {
        throw new Error(error?.message || data?.error || 'Payment verification failed');
      }

      toast({
        title: "Payment Successful!",
        description: "Your cabin booking has been confirmed.",
      });

      return data;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Payment verification failed';
      setError(errorMessage);
      console.error('Error verifying payment:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const checkAvailability = useCallback(async (cabinId: string, startDate: string, endDate: string) => {
    try {
      const { data, error } = await supabase.rpc('check_cabin_availability_for_dates', {
        p_cabin_id: cabinId,
        p_start_date: startDate,
        p_end_date: endDate
      });

      if (error) {
        console.error('Error checking availability:', error);
        return false;
      }

      return data === true;
    } catch (err) {
      console.error('Error checking cabin availability:', err);
      return false;
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    loading,
    error,
    createBooking,
    processPayment,
    verifyPayment,
    checkAvailability,
    clearError
  };
};