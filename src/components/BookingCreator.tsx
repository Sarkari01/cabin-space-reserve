import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface BookingIntent {
  study_hall_id: string;
  seat_id: string;
  booking_period: "daily" | "weekly" | "monthly";
  start_date: string;
  end_date: string;
  total_amount: number;
}

export const createBookingFromIntent = async (bookingIntent: BookingIntent, userId: string, transactionId?: string) => {
  const { toast } = useToast();
  
  try {
    // Create booking
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .insert({
        ...bookingIntent,
        user_id: userId,
        status: 'confirmed'
      })
      .select()
      .single();

    if (bookingError) {
      console.error('Error creating booking:', bookingError);
      throw bookingError;
    }

    // Mark seat as unavailable
    const { error: seatError } = await supabase
      .from('seats')
      .update({ is_available: false })
      .eq('id', bookingIntent.seat_id);

    if (seatError) {
      console.error('Error updating seat availability:', seatError);
    }

    // Update transaction with booking_id if provided
    if (transactionId) {
      const { error: transactionError } = await supabase
        .from('transactions')
        .update({ booking_id: booking.id })
        .eq('id', transactionId);

      if (transactionError) {
        console.error('Error updating transaction:', transactionError);
      }
    }

    return booking;
  } catch (error) {
    console.error('Error in createBookingFromIntent:', error);
    throw error;
  }
};