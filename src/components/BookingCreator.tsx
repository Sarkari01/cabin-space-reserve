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

export const createBookingFromIntent = async (
  bookingIntent: BookingIntent, 
  userId: string, 
  transactionId?: string,
  bookingStatus: 'confirmed' | 'pending' = 'confirmed',
  paymentStatus: 'paid' | 'unpaid' = 'paid'
) => {
  console.log('=== Creating booking from intent ===');
  console.log('Booking intent:', bookingIntent);
  console.log('User ID:', userId);
  console.log('Transaction ID:', transactionId);
  
  try {
    if (!userId) {
      throw new Error('User ID is required to create booking');
    }

    if (!bookingIntent.study_hall_id || !bookingIntent.seat_id) {
      throw new Error('Study hall ID and seat ID are required');
    }

    // Create booking
    console.log('Inserting booking into database with status:', bookingStatus, 'payment:', paymentStatus);
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .insert({
        study_hall_id: bookingIntent.study_hall_id,
        seat_id: bookingIntent.seat_id,
        booking_period: bookingIntent.booking_period,
        start_date: bookingIntent.start_date,
        end_date: bookingIntent.end_date,
        total_amount: bookingIntent.total_amount,
        user_id: userId,
        status: bookingStatus,
        payment_status: paymentStatus
      })
      .select()
      .single();

    if (bookingError) {
      console.error('Error creating booking:', bookingError);
      throw new Error(`Failed to create booking: ${bookingError.message}`);
    }

    console.log('Booking created successfully:', booking);

    // Mark seat as unavailable
    console.log('Updating seat availability...');
    const { error: seatError } = await supabase
      .from('seats')
      .update({ is_available: false })
      .eq('id', bookingIntent.seat_id);

    if (seatError) {
      console.error('Error updating seat availability:', seatError);
      // Don't throw here, just log the error as booking is already created
    } else {
      console.log('Seat marked as unavailable successfully');
    }

    // Update transaction with booking_id if provided
    if (transactionId) {
      console.log('Linking transaction to booking...');
      const { error: transactionError } = await supabase
        .from('transactions')
        .update({ booking_id: booking.id })
        .eq('id', transactionId);

      if (transactionError) {
        console.error('Error updating transaction with booking_id:', transactionError);
        // Don't throw here, just log the error as booking is already created
      } else {
        console.log('Transaction linked to booking successfully');
      }
    }

    console.log('=== Booking creation completed successfully ===');
    return booking;
  } catch (error) {
    console.error('=== Error in createBookingFromIntent ===');
    console.error('Error details:', error);
    throw error;
  }
};