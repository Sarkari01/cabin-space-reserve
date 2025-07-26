import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from './use-toast';

export interface DateAvailability {
  date: string;
  availableSeats: string[];
  occupiedSeats: string[];
  totalSeats: number;
}

export interface BookingConflict {
  booking_id: string;
  start_date: string;
  end_date: string;
  user_id: string;
}

export const useBookingAvailability = () => {
  const { toast } = useToast();

  /**
   * Check if a specific seat is available for a date range
   */
  const checkSeatAvailability = async (
    seatId: string,
    startDate: string,
    endDate: string
  ): Promise<{ available: boolean; conflicts: BookingConflict[] }> => {
    try {
      console.log(`Checking availability for seat ${seatId} from ${startDate} to ${endDate}`);
      
      // Use proper date range overlap logic: (start1 <= end2) AND (end1 >= start2)
      const { data: conflicts, error } = await supabase
        .from('bookings')
        .select('id, start_date, end_date, user_id')
        .eq('seat_id', seatId)
        .in('status', ['confirmed', 'active', 'pending'])
        .lte('start_date', endDate)
        .gte('end_date', startDate);

      if (error) {
        console.error('Error checking seat availability:', error);
        throw error;
      }

      const hasConflicts = conflicts && conflicts.length > 0;
      console.log(`Availability check result: ${hasConflicts ? 'UNAVAILABLE' : 'AVAILABLE'} (${conflicts?.length || 0} conflicts)`);
      
      return {
        available: !hasConflicts,
        conflicts: hasConflicts ? conflicts.map(c => ({
          booking_id: c.id,
          start_date: c.start_date,
          end_date: c.end_date,
          user_id: c.user_id
        })) : []
      };
    } catch (error: any) {
      console.error('Error in checkSeatAvailability:', error);
      toast({
        title: "Error",
        description: "Failed to check seat availability",
        variant: "destructive",
      });
      return { available: false, conflicts: [] };
    }
  };

  /**
   * Get availability map for all seats in a study hall for a date range
   */
  const getSeatAvailabilityMap = async (
    studyHallId: string,
    startDate: string,
    endDate: string
  ): Promise<Record<string, boolean>> => {
    const timeoutDuration = 10000; // 10 second timeout
    
    try {
      console.log(`Getting availability map for study hall ${studyHallId} from ${startDate} to ${endDate}`);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutDuration);
      
      try {
        // Get all seats for the study hall
        const { data: seats, error: seatsError } = await supabase
          .from('seats')
          .select('id')
          .eq('study_hall_id', studyHallId)
          .abortSignal(controller.signal);

        if (seatsError) throw seatsError;

        if (!seats || seats.length === 0) {
          clearTimeout(timeoutId);
          return {};
        }

        // Use proper date range overlap logic: (start1 <= end2) AND (end1 >= start2)
        const { data: conflicts, error: conflictsError } = await supabase
          .from('bookings')
          .select('seat_id')
          .eq('study_hall_id', studyHallId)
          .in('status', ['confirmed', 'active', 'pending'])
          .lte('start_date', endDate)
          .gte('end_date', startDate)
          .abortSignal(controller.signal);

        if (conflictsError) throw conflictsError;

        clearTimeout(timeoutId);
        
        const occupiedSeatIds = new Set(conflicts?.map(c => c.seat_id) || []);
        console.log(`Found ${conflicts?.length || 0} conflicting bookings affecting ${occupiedSeatIds.size} seats`);
        
        const availabilityMap: Record<string, boolean> = {};
        seats.forEach(seat => {
          availabilityMap[seat.id] = !occupiedSeatIds.has(seat.id);
        });

        return availabilityMap;
      } catch (error: any) {
        clearTimeout(timeoutId);
        if (error.name === 'AbortError') {
          throw new Error('Request timeout - please try again');
        }
        throw error;
      }
    } catch (error: any) {
      console.error('Error in getSeatAvailabilityMap:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to get seat availability",
        variant: "destructive",
      });
      return {};
    }
  };

  /**
   * Calculate booking amount with Razorpay fee handling
   * Returns final amount that includes the fee as a "discount"
   */
  const calculateBookingAmount = (
    startDate: string,
    endDate: string,
    monthlyPrice: number
  ): {
    amount: number; 
    baseAmount: number;
    discountAmount: number;
    finalAmount: number;
    days: number; 
    method: string;
    priceBreakdown: {
      baseMonthly: number;
    };
  } => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const timeDiff = end.getTime() - start.getTime();
    const days = Math.ceil(timeDiff / (1000 * 3600 * 24)) + 1;

    console.log(`Calculating amount for ${days} days from ${startDate} to ${endDate}`);

    // Calculate customer original price (merchant price - ₹100)
    const baseMonthlyPrice = monthlyPrice - 100;

    // Calculate total for monthly method using base price
    const monthlyTotal = Math.ceil(days / 30) * baseMonthlyPrice;

    const baseAmount = monthlyTotal;
    const calculationMethod = 'monthly';

    // Calculate the "discount" amount (covers Razorpay fee)
    const discountAmount = Math.round(baseAmount * 0.02);
    const finalAmount = baseAmount + discountAmount; // Original price + 2%

    return { 
      amount: finalAmount, 
      baseAmount,
      discountAmount,
      finalAmount,
      days, 
      method: calculationMethod,
      priceBreakdown: {
        baseMonthly: baseMonthlyPrice
      }
    };
  };

  /**
   * Get date-wise availability for a study hall
   */
  const getDateAvailability = async (
    studyHallId: string,
    dates: string[]
  ): Promise<Record<string, DateAvailability>> => {
    try {
      console.log(`Getting date availability for study hall ${studyHallId} for dates:`, dates);
      
      // Get all seats for the study hall
      const { data: seats, error: seatsError } = await supabase
        .from('seats')
        .select('id, seat_id')
        .eq('study_hall_id', studyHallId);

      if (seatsError) throw seatsError;

      if (!seats || seats.length === 0) {
        return {};
      }

      const result: Record<string, DateAvailability> = {};

      for (const date of dates) {
        // Get bookings that overlap with this specific date
        const { data: bookings, error: bookingsError } = await supabase
          .from('bookings')
          .select('seat_id')
          .eq('study_hall_id', studyHallId)
          .in('status', ['confirmed', 'active', 'pending'])
          .lte('start_date', date)
          .gte('end_date', date);

        if (bookingsError) throw bookingsError;

        const occupiedSeatIds = new Set(bookings?.map(b => b.seat_id) || []);
        const availableSeats = seats.filter(seat => !occupiedSeatIds.has(seat.id));
        const occupiedSeats = seats.filter(seat => occupiedSeatIds.has(seat.id));

        result[date] = {
          date,
          availableSeats: availableSeats.map(s => s.id),
          occupiedSeats: occupiedSeats.map(s => s.id),
          totalSeats: seats.length
        };
      }

      return result;
    } catch (error: any) {
      console.error('Error in getDateAvailability:', error);
      toast({
        title: "Error",
        description: "Failed to get date availability",
        variant: "destructive",
      });
      return {};
    }
  };

  /**
   * Release seats for expired bookings
   */
  const releaseExpiredBookings = async (): Promise<{ releasedCount: number }> => {
    try {
      console.log('Releasing expired bookings...');
      
      const today = new Date().toISOString().split('T')[0];
      
      // Find expired bookings
      const { data: expiredBookings, error: findError } = await supabase
        .from('bookings')
        .select('id, seat_id')
        .in('status', ['active', 'confirmed'])
        .lt('end_date', today);

      if (findError) throw findError;

      if (!expiredBookings || expiredBookings.length === 0) {
        console.log('No expired bookings found');
        return { releasedCount: 0 };
      }

      console.log(`Found ${expiredBookings.length} expired bookings`);

      // Update expired bookings to completed
      const { error: updateBookingsError } = await supabase
        .from('bookings')
        .update({ status: 'completed' })
        .in('id', expiredBookings.map(b => b.id));

      if (updateBookingsError) throw updateBookingsError;

      // Release the seats
      const { error: releaseSeatsError } = await supabase
        .from('seats')
        .update({ is_available: true })
        .in('id', expiredBookings.map(b => b.seat_id));

      if (releaseSeatsError) throw releaseSeatsError;

      console.log(`Released ${expiredBookings.length} expired bookings`);
      
      return { releasedCount: expiredBookings.length };
    } catch (error: any) {
      console.error('Error in releaseExpiredBookings:', error);
      toast({
        title: "Error",
        description: "Failed to release expired bookings",
        variant: "destructive",
      });
      return { releasedCount: 0 };
    }
  };

  return {
    checkSeatAvailability,
    getSeatAvailabilityMap,
    calculateBookingAmount,
    getDateAvailability,
    releaseExpiredBookings,
  };
};