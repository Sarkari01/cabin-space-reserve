import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { useToast } from "./use-toast";

export interface CombinedBooking {
  id: string;
  booking_number?: number;
  type: 'study_hall' | 'cabin';
  user_id: string | null;
  location_id: string; // study_hall_id or private_hall_id
  unit_id: string; // seat_id or cabin_id
  start_date: string;
  end_date: string;
  total_amount: number;
  status: string;
  payment_status: string;
  created_at: string;
  updated_at: string;
  guest_name?: string | null;
  guest_email?: string | null;
  guest_phone?: string | null;
  // Related data
  location?: {
    name: string;
    location: string;
    image_url?: string;
  };
  unit?: {
    name: string;
    identifier: string;
  };
}

export const useCombinedBookings = () => {
  const { user, userRole } = useAuth();
  const { toast } = useToast();
  const [bookings, setBookings] = useState<CombinedBooking[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCombinedBookings = useCallback(async () => {
    if (!user) {
      setBookings([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      // Ensure session is valid
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        console.error('No active session for combined booking fetch');
        setBookings([]);
        setLoading(false);
        return;
      }

      const combinedBookings: CombinedBooking[] = [];

      // Fetch study hall bookings
      const { data: studyHallBookings, error: studyHallError } = await supabase
        .from("bookings")
        .select(`
          *,
          study_hall:study_halls(name, location, image_url),
          seat:seats(seat_id, row_name, seat_number)
        `)
        .eq("user_id", user.id);

      if (studyHallError) {
        console.error("Error fetching study hall bookings:", studyHallError);
      } else if (studyHallBookings) {
        studyHallBookings.forEach(booking => {
          combinedBookings.push({
            id: booking.id,
            booking_number: booking.booking_number,
            type: 'study_hall',
            user_id: booking.user_id,
            location_id: booking.study_hall_id,
            unit_id: booking.seat_id,
            start_date: booking.start_date,
            end_date: booking.end_date,
            total_amount: booking.total_amount,
            status: booking.status,
            payment_status: booking.payment_status || 'unpaid',
            created_at: booking.created_at,
            updated_at: booking.updated_at,
            guest_name: booking.guest_name,
            guest_email: booking.guest_email,
            guest_phone: booking.guest_phone,
            location: booking.study_hall ? {
              name: booking.study_hall.name,
              location: booking.study_hall.location,
              image_url: booking.study_hall.image_url
            } : undefined,
            unit: booking.seat ? {
              name: `Seat ${booking.seat.seat_id}`,
              identifier: booking.seat.seat_id
            } : undefined
          });
        });
      }

      // Fetch cabin bookings  
      const { data: cabinBookings, error: cabinError } = await supabase
        .from("cabin_bookings")
        .select(`
          *,
          private_hall:private_halls!cabin_bookings_private_hall_id_fkey(name, location),
          cabin:cabins!cabin_bookings_cabin_id_fkey(cabin_name, cabin_number)
        `)
        .eq("user_id", user.id);

      if (cabinError) {
        console.error("Error fetching cabin bookings:", cabinError);
      } else if (cabinBookings) {
        cabinBookings.forEach(booking => {
          combinedBookings.push({
            id: booking.id,
            booking_number: booking.booking_number,
            type: 'cabin',
            user_id: booking.user_id,
            location_id: booking.private_hall_id,
            unit_id: booking.cabin_id,
            start_date: booking.start_date,
            end_date: booking.end_date,
            total_amount: booking.total_amount,
            status: booking.status,
            payment_status: booking.payment_status || 'unpaid',
            created_at: booking.created_at,
            updated_at: booking.updated_at,
            guest_name: booking.guest_name,
            guest_email: booking.guest_email,
            guest_phone: booking.guest_phone,
            location: booking.private_hall ? {
              name: booking.private_hall.name,
              location: booking.private_hall.location
            } : undefined,
            unit: booking.cabin ? {
              name: booking.cabin.cabin_name,
              identifier: booking.cabin.cabin_name
            } : undefined
          });
        });
      }

      // Sort by created_at descending
      combinedBookings.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      
      console.log(`Fetched ${combinedBookings.length} combined bookings for user ${user.id}`);
      setBookings(combinedBookings);

    } catch (error) {
      console.error("Error fetching combined bookings:", error);
      toast({
        title: "Error",
        description: "Failed to fetch your bookings",
        variant: "destructive",
      });
      setBookings([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  useEffect(() => {
    fetchCombinedBookings();
    
    // Set up real-time subscription for cabin bookings updates
    const cabinBookingsChannel = supabase
      .channel('cabin-bookings-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'cabin_bookings'
        },
        (payload) => {
          console.log('Cabin booking changed:', payload);
          fetchCombinedBookings();
        }
      )
      .subscribe();

    // Set up real-time subscription for study hall bookings updates  
    const studyHallBookingsChannel = supabase
      .channel('study-hall-bookings-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'bookings'
        },
        (payload) => {
          console.log('Study hall booking changed:', payload);
          fetchCombinedBookings();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(cabinBookingsChannel);
      supabase.removeChannel(studyHallBookingsChannel);
    };
  }, [fetchCombinedBookings]);

  const getUpcomingBookings = () => {
    return bookings.filter(booking => 
      ['confirmed', 'pending', 'active'].includes(booking.status) &&
      new Date(booking.start_date) >= new Date()
    );
  };

  const getCompletedBookings = () => {
    return bookings.filter(booking => booking.status === 'completed');
  };

  const getTotalSpent = () => {
    return bookings
      .filter(booking => booking.status === 'completed')
      .reduce((sum, booking) => sum + Number(booking.total_amount), 0);
  };

  return {
    bookings,
    loading,
    fetchCombinedBookings,
    getUpcomingBookings,
    getCompletedBookings,
    getTotalSpent
  };
};