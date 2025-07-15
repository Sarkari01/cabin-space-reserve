import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useBookingAvailability } from "@/hooks/useBookingAvailability";

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

    // Validate booking dates
    const startDate = new Date(bookingIntent.start_date);
    const endDate = new Date(bookingIntent.end_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (startDate < today) {
      throw new Error('Cannot create booking for past dates');
    }

    if (endDate < startDate) {
      throw new Error('End date must be after start date');
    }

    // Final availability check before creating booking
    console.log('Performing final availability check...');
    const { data: conflictCheck, error: conflictError } = await supabase
      .from('bookings')
      .select('id')
      .eq('seat_id', bookingIntent.seat_id)
      .in('status', ['confirmed', 'active', 'pending'])
      .or(`and(start_date.lte.${bookingIntent.end_date},end_date.gte.${bookingIntent.start_date})`);

    if (conflictError) {
      console.error('Error checking for conflicts:', conflictError);
      throw new Error('Failed to verify seat availability');
    }

    if (conflictCheck && conflictCheck.length > 0) {
      throw new Error('Seat is no longer available for the selected dates. Another booking may have been created.');
    }

    // Get study hall details for payment validation
    console.log('Validating payment amount...');
    const { data: studyHall, error: hallError } = await supabase
      .from('study_halls')
      .select('daily_price, weekly_price, monthly_price')
      .eq('id', bookingIntent.study_hall_id)
      .single();

    if (hallError) {
      console.error('Error fetching study hall details:', hallError);
      throw new Error('Failed to validate booking details');
    }

    // Calculate expected amount and validate
    const start = new Date(bookingIntent.start_date);
    const end = new Date(bookingIntent.end_date);
    const timeDiff = end.getTime() - start.getTime();
    const days = Math.ceil(timeDiff / (1000 * 3600 * 24)) + 1;

    const dailyTotal = days * studyHall.daily_price;
    const weeklyTotal = Math.ceil(days / 7) * studyHall.weekly_price;
    const monthlyTotal = Math.ceil(days / 30) * studyHall.monthly_price;

    let expectedAmount = dailyTotal;
    if (days >= 7 && weeklyTotal < expectedAmount) {
      expectedAmount = weeklyTotal;
    }
    if (days >= 30 && monthlyTotal < expectedAmount) {
      expectedAmount = monthlyTotal;
    }

    // Allow for small rounding differences (up to 1 rupee)
    if (Math.abs(bookingIntent.total_amount - expectedAmount) > 1) {
      console.error('Payment amount mismatch:', {
        provided: bookingIntent.total_amount,
        expected: expectedAmount,
        days: days
      });
      throw new Error(`Invalid payment amount. Expected ₹${expectedAmount}, got ₹${bookingIntent.total_amount}`);
    }

    console.log('Payment amount validated successfully');

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