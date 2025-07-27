import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useBookingAvailability } from "@/hooks/useBookingAvailability";

interface BookingIntent {
  study_hall_id: string;
  seat_id: string;
  booking_period: "1_month" | "2_months" | "3_months" | "6_months" | "12_months";
  start_date: string;
  end_date: string;
  total_amount: number;
  original_amount?: number;
  coupon_code?: string;
  coupon_discount?: number;
  reward_points_used?: number;
  reward_discount?: number;
  total_discount?: number;
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

    // Final availability check before creating booking using database function
    console.log('Performing final availability check...');
    const { data: availabilityResult, error: availabilityError } = await supabase
      .rpc('check_seat_availability', {
        p_seat_id: bookingIntent.seat_id,
        p_start_date: bookingIntent.start_date,
        p_end_date: bookingIntent.end_date
      });

    if (availabilityError) {
      console.error('Error checking seat availability:', availabilityError);
      throw new Error('Failed to verify seat availability');
    }

    if (!availabilityResult) {
      throw new Error('Seat is no longer available for the selected dates. Another booking may have been created.');
    }

    // Get study hall details for payment validation
    console.log('Validating payment amount...');
    const { data: studyHall, error: hallError } = await supabase
      .from('study_halls')
      .select('monthly_price')
      .eq('id', bookingIntent.study_hall_id)
      .single();

    if (hallError) {
      console.error('Error fetching study hall details:', hallError);
      throw new Error('Failed to validate booking details');
    }

    // Calculate expected amount based on booking period and monthly price
    const start = new Date(bookingIntent.start_date);
    const end = new Date(bookingIntent.end_date);
    const timeDiff = end.getTime() - start.getTime();
    const days = Math.ceil(timeDiff / (1000 * 3600 * 24)) + 1;

    // Determine expected months based on booking period
    let expectedMonths = 1;
    if (bookingIntent.booking_period === "2_months") expectedMonths = 2;
    else if (bookingIntent.booking_period === "3_months") expectedMonths = 3;
    else if (bookingIntent.booking_period === "6_months") expectedMonths = 6;
    else if (bookingIntent.booking_period === "12_months") expectedMonths = 12;

    const expectedAmount = expectedMonths * studyHall.monthly_price;

    // Allow for small rounding differences (up to 1 rupee)
    if (Math.abs(bookingIntent.total_amount - expectedAmount) > 1) {
      console.error('Payment amount mismatch:', {
        provided: bookingIntent.total_amount,
        expected: expectedAmount,
        months: expectedMonths,
        days: days
      });
      throw new Error(`Invalid payment amount. Expected ₹${expectedAmount}, got ₹${bookingIntent.total_amount}`);
    }

    console.log('Payment amount validated successfully');

    // Process coupon if provided
    if (bookingIntent.coupon_code && bookingIntent.coupon_discount) {
      console.log('Processing coupon:', bookingIntent.coupon_code);
      try {
        // Validate coupon one more time and record usage
        const { data: couponData, error: couponError } = await supabase.functions.invoke('validate-coupon', {
          body: {
            coupon_code: bookingIntent.coupon_code,
            booking_amount: bookingIntent.original_amount || bookingIntent.total_amount,
            study_hall_id: bookingIntent.study_hall_id,
            apply_usage: true // This will record the usage
          }
        });

        if (couponError) {
          console.error('Coupon validation failed during booking:', couponError);
          throw new Error(`Coupon validation failed: ${couponError.message}`);
        }

        if (!couponData?.valid) {
          console.error('Coupon is no longer valid during booking');
          throw new Error('Coupon is no longer valid');
        }

        console.log('Coupon processed successfully');
      } catch (error) {
        console.error('Error processing coupon:', error);
        throw new Error(`Failed to process coupon: ${error.message}`);
      }
    }

    // Process reward redemption if provided
    if (bookingIntent.reward_points_used && bookingIntent.reward_discount) {
      console.log('Processing reward redemption:', bookingIntent.reward_points_used, 'points');
      try {
        const { data: rewardData, error: rewardError } = await supabase.functions.invoke('redeem-rewards', {
          body: {
            points_to_redeem: bookingIntent.reward_points_used,
            booking_amount: bookingIntent.original_amount || bookingIntent.total_amount,
            validate_only: false // This will actually redeem the points
          }
        });

        if (rewardError) {
          console.error('Reward redemption failed during booking:', rewardError);
          throw new Error(`Reward redemption failed: ${rewardError.message}`);
        }

        if (!rewardData?.success) {
          console.error('Reward redemption failed:', rewardData?.error);
          throw new Error(`Reward redemption failed: ${rewardData?.error}`);
        }

        console.log('Reward redemption processed successfully');
      } catch (error) {
        console.error('Error processing reward redemption:', error);
        throw new Error(`Failed to process reward redemption: ${error.message}`);
      }
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

    // Update transaction with booking_id and discount details if provided
    if (transactionId) {
      console.log('Linking transaction to booking...');
      const transactionUpdateData: any = { 
        booking_id: booking.id,
        payment_data: {
          bookingIntent: bookingIntent,
          coupon_applied: bookingIntent.coupon_code ? {
            code: bookingIntent.coupon_code,
            discount: bookingIntent.coupon_discount
          } : null,
          rewards_redeemed: bookingIntent.reward_points_used ? {
            points_used: bookingIntent.reward_points_used,
            discount: bookingIntent.reward_discount
          } : null,
          total_discount: bookingIntent.total_discount || 0,
          original_amount: bookingIntent.original_amount || bookingIntent.total_amount,
          final_amount: bookingIntent.total_amount
        }
      };

      const { error: transactionError } = await supabase
        .from('transactions')
        .update(transactionUpdateData)
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