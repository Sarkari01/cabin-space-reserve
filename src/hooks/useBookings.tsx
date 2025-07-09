import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { useToast } from "./use-toast";

export interface Booking {
  id: string;
  user_id: string;
  study_hall_id: string;
  seat_id: string;
  booking_period: "daily" | "weekly" | "monthly";
  start_date: string;
  end_date: string;
  total_amount: number;
  status: "pending" | "confirmed" | "cancelled" | "completed" | "refunded";
  created_at: string;
  updated_at: string;
  study_hall?: {
    name: string;
    location: string;
    image_url?: string;
  };
  seat?: {
    seat_id: string;
    row_name: string;
    seat_number: number;
  };
  user?: {
    full_name: string;
    email: string;
  };
}

export const useBookings = (forceRole?: "student" | "merchant" | "admin") => {
  const { user, userRole } = useAuth();
  const effectiveRole = forceRole || userRole;
  const { toast } = useToast();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchBookings = async () => {
    if (!user) return;

    try {
      setLoading(true);
      console.log("Fetching bookings for user:", user.id, "role:", effectiveRole);
      
      let query = supabase
        .from("bookings")
        .select(`
          *,
          study_hall:study_halls(name, location, image_url),
          seat:seats(seat_id, row_name, seat_number),
          user:profiles(full_name, email)
        `);

      if (effectiveRole === "student") {
        console.log("Filtering bookings for student:", user.id);
        query = query.eq("user_id", user.id);
      } else if (effectiveRole === "merchant") {
        console.log("Fetching study halls for merchant:", user.id);
        console.log("User role in auth:", userRole, "Effective role:", effectiveRole);
        
        // Get study hall IDs for merchant first
        const { data: merchantStudyHalls, error: studyHallError } = await supabase
          .from("study_halls")
          .select("id")
          .eq("merchant_id", user.id);
        
        console.log("Merchant study halls:", merchantStudyHalls);
        console.log("Merchant study halls error:", studyHallError);
        
        if (studyHallError) {
          console.error("Error fetching merchant study halls:", studyHallError);
          toast({
            title: "Error",
            description: "Failed to fetch study halls for merchant",
            variant: "destructive",
          });
          setBookings([]);
          return;
        }
        
        const studyHallIds = merchantStudyHalls?.map(sh => sh.id) || [];
        console.log("Study hall IDs for filtering:", studyHallIds);
        console.log("Study hall IDs length:", studyHallIds.length);
        
        if (studyHallIds.length > 0) {
          console.log("Filtering bookings by study hall IDs:", studyHallIds);
          query = query.in("study_hall_id", studyHallIds);
        } else {
          console.log("No study halls found for merchant, returning empty bookings");
          setBookings([]);
          setLoading(false);
          return;
        }
      }
      // Admin sees all bookings
      console.log("Executing booking query...");

      const { data, error } = await query.order("created_at", { ascending: false });
      console.log("Booking query result:", { data, error });

      if (error) throw error;
      setBookings((data || []) as Booking[]);
    } catch (error) {
      console.error("Error fetching bookings:", error);
      toast({
        title: "Error",
        description: "Failed to fetch bookings",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createBooking = async (bookingData: {
    study_hall_id: string;
    seat_id: string;
    booking_period: "daily" | "weekly" | "monthly";
    start_date: string;
    end_date: string;
    total_amount: number;
  }) => {
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to make a booking",
        variant: "destructive",
      });
      return false;
    }

    try {
      // Start a transaction to update both booking and seat availability
      const { data: booking, error: bookingError } = await supabase
        .from("bookings")
        .insert({
          ...bookingData,
          user_id: user.id,
          status: "pending"
        })
        .select()
        .single();

      if (bookingError) throw bookingError;

      // Update seat availability to false (booked)
      const { error: seatError } = await supabase
        .from("seats")
        .update({ is_available: false })
        .eq("id", bookingData.seat_id);

      if (seatError) {
        console.error("Error updating seat availability:", seatError);
        // Still proceed with booking even if seat update fails
      }

      toast({
        title: "Success",
        description: "Booking created successfully",
      });

      fetchBookings();
      return true;
    } catch (error) {
      console.error("Error creating booking:", error);
      toast({
        title: "Error",
        description: "Failed to create booking",
        variant: "destructive",
      });
      return false;
    }
  };

  const updateBookingStatus = async (bookingId: string, status: string) => {
    try {
      // First get the booking to access seat_id
      const { data: booking, error: fetchError } = await supabase
        .from("bookings")
        .select("seat_id")
        .eq("id", bookingId)
        .single();

      if (fetchError) throw fetchError;

      // Update booking status
      const { error } = await supabase
        .from("bookings")
        .update({ status })
        .eq("id", bookingId);

      if (error) throw error;

      // Update seat availability based on status
      if (booking?.seat_id) {
        const is_available = status === 'cancelled' || status === 'refunded';
        const { error: seatError } = await supabase
          .from("seats")
          .update({ is_available })
          .eq("id", booking.seat_id);

        if (seatError) {
          console.error("Error updating seat availability:", seatError);
        }
      }

      toast({
        title: "Success",
        description: "Booking status updated successfully",
      });

      fetchBookings();
      return true;
    } catch (error) {
      console.error("Error updating booking:", error);
      toast({
        title: "Error",
        description: "Failed to update booking status",
        variant: "destructive",
      });
      return false;
    }
  };

  const cancelBooking = async (bookingId: string) => {
    return updateBookingStatus(bookingId, "cancelled");
  };

  useEffect(() => {
    fetchBookings();
  }, [user, effectiveRole]);

  // Real-time subscription for bookings
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('bookings-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'bookings'
        },
        (payload) => {
          console.log('Booking change detected:', payload);
          fetchBookings(); // Refresh bookings when changes occur
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const updateBooking = async (bookingId: string, updates: Partial<Booking>) => {
    try {
      const { error } = await supabase
        .from("bookings")
        .update(updates)
        .eq("id", bookingId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Booking updated successfully",
      });

      fetchBookings();
      return true;
    } catch (error) {
      console.error("Error updating booking:", error);
      toast({
        title: "Error",
        description: "Failed to update booking",
        variant: "destructive",
      });
      return false;
    }
  };

  return {
    bookings,
    loading,
    fetchBookings,
    createBooking,
    updateBookingStatus,
    updateBooking,
    cancelBooking,
  };
};