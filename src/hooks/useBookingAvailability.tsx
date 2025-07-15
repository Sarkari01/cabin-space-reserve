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
      
      const { data: conflicts, error } = await supabase
        .from('bookings')
        .select('id, start_date, end_date, user_id')
        .eq('seat_id', seatId)
        .in('status', ['confirmed', 'active', 'pending'])
        .or(`and(start_date.lte.${endDate},end_date.gte.${startDate})`);

      if (error) {
        console.error('Error checking seat availability:', error);
        throw error;
      }

      const hasConflicts = conflicts && conflicts.length > 0;
      
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
    try {
      console.log(`Getting availability map for study hall ${studyHallId} from ${startDate} to ${endDate}`);
      
      // Get all seats for the study hall
      const { data: seats, error: seatsError } = await supabase
        .from('seats')
        .select('id')
        .eq('study_hall_id', studyHallId);

      if (seatsError) throw seatsError;

      if (!seats || seats.length === 0) {
        return {};
      }

      // Get all conflicting bookings for the date range
      const { data: conflicts, error: conflictsError } = await supabase
        .from('bookings')
        .select('seat_id')
        .eq('study_hall_id', studyHallId)
        .in('status', ['confirmed', 'active', 'pending'])
        .or(`and(start_date.lte.${endDate},end_date.gte.${startDate})`);

      if (conflictsError) throw conflictsError;

      const occupiedSeatIds = new Set(conflicts?.map(c => c.seat_id) || []);
      
      const availabilityMap: Record<string, boolean> = {};
      seats.forEach(seat => {
        availabilityMap[seat.id] = !occupiedSeatIds.has(seat.id);
      });

      return availabilityMap;
    } catch (error: any) {
      console.error('Error in getSeatAvailabilityMap:', error);
      toast({
        title: "Error",
        description: "Failed to get seat availability",
        variant: "destructive",
      });
      return {};
    }
  };

  /**
   * Calculate booking amount based on actual date range
   */
  const calculateBookingAmount = (
    startDate: string,
    endDate: string,
    dailyPrice: number,
    weeklyPrice: number,
    monthlyPrice: number
  ): { amount: number; days: number; method: string } => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const timeDiff = end.getTime() - start.getTime();
    const days = Math.ceil(timeDiff / (1000 * 3600 * 24)) + 1; // +1 to include both start and end dates

    console.log(`Calculating amount for ${days} days from ${startDate} to ${endDate}`);

    // Choose the most cost-effective pricing option
    const dailyTotal = days * dailyPrice;
    const weeklyTotal = Math.ceil(days / 7) * weeklyPrice;
    const monthlyTotal = Math.ceil(days / 30) * monthlyPrice;

    let amount = dailyTotal;
    let calculationMethod = 'daily';

    // Use weekly pricing if it's cheaper and booking is 7+ days
    if (days >= 7 && weeklyTotal < amount) {
      amount = weeklyTotal;
      calculationMethod = 'weekly';
    }

    // Use monthly pricing if it's cheaper and booking is 30+ days
    if (days >= 30 && monthlyTotal < amount) {
      amount = monthlyTotal;
      calculationMethod = 'monthly';
    }

    return { amount, days, method: calculationMethod };
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