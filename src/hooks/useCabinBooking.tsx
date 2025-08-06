import { useState, useCallback, useRef } from 'react';
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
  const { user, session } = useAuth();
  const { toast } = useToast();
  const retryAttemptRef = useRef(0);
  const maxRetries = 3;

  // Enhanced session refresh with retry logic
  const refreshSession = useCallback(async () => {
    try {
      const { data: { session: newSession }, error } = await supabase.auth.refreshSession();
      if (error) {
        console.warn('Session refresh failed:', error.message);
        return false;
      }
      return !!newSession;
    } catch (err) {
      console.error('Session refresh error:', err);
      return false;
    }
  }, []);

  const createBooking = useCallback(async (bookingData: CabinBookingRequest) => {
    // Enhanced authentication validation
    if (!user || !session) {
      throw new Error('User must be authenticated to create booking');
    }

    setLoading(true);
    setError(null);
    retryAttemptRef.current = 0;

    const attemptBooking = async (): Promise<string> => {
      try {
        console.log('Creating cabin booking (attempt:', retryAttemptRef.current + 1, '):', bookingData);

        // Refresh session before critical operation
        const sessionValid = await refreshSession();
        if (!sessionValid && retryAttemptRef.current === 0) {
          throw new Error('Session refresh failed - please log in again');
        }

        // Use the secure database function with enhanced error parsing
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

        // Enhanced error handling with specific error codes
        if (error) {
          console.error('RPC Error:', error);
          
          // Check for authentication-related errors
          if (error.message?.includes('relation') && error.message?.includes('does not exist')) {
            if (retryAttemptRef.current < maxRetries) {
              retryAttemptRef.current++;
              console.log('Retrying booking creation due to relation error...');
              await new Promise(resolve => setTimeout(resolve, 1000 * retryAttemptRef.current));
              return attemptBooking();
            }
            throw new Error('Database connection error. Please try again later.');
          }
          
          throw new Error(error.message || 'Failed to create booking');
        }

        if (!(result as any)?.success) {
          const errorMessage = (result as any)?.error || 'Failed to create booking';
          const errorCode = (result as any)?.code;
          
          // Handle specific error codes
          switch (errorCode) {
            case 'AUTH_REQUIRED':
              throw new Error('Please log in again to continue');
            case 'CABIN_UNAVAILABLE':
              throw new Error('This cabin is no longer available');
            case 'HALL_UNAVAILABLE':
              throw new Error('This private hall is currently unavailable');
            case 'DATE_CONFLICT':
              throw new Error('Cabin is not available for the selected dates');
            default:
              throw new Error(errorMessage);
          }
        }

        const bookingId = (result as any).booking_id;
        if (!bookingId) {
          throw new Error('Booking created but no ID returned');
        }

        console.log('Booking created successfully:', bookingId);
        return bookingId;

      } catch (err) {
        // Retry logic for specific errors
        if (retryAttemptRef.current < maxRetries && 
            err instanceof Error && 
            (err.message.includes('relation') || err.message.includes('auth'))) {
          retryAttemptRef.current++;
          console.log(`Retrying booking creation (attempt ${retryAttemptRef.current})...`);
          await new Promise(resolve => setTimeout(resolve, 1000 * retryAttemptRef.current));
          return attemptBooking();
        }
        throw err;
      }
    };

    try {
      return await attemptBooking();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      console.error('Error creating booking:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [user, session, refreshSession, maxRetries]);

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