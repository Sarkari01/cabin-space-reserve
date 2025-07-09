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

export const useBookings = () => {
  const { user, userRole } = useAuth();
  const { toast } = useToast();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchBookings = async () => {
    if (!user) return;

    try {
      setLoading(true);
      let query = supabase
        .from("bookings")
        .select(`
          *,
          study_hall:study_halls(name, location, image_url),
          seat:seats(seat_id, row_name, seat_number),
          user:profiles(full_name, email)
        `);

      if (userRole === "student") {
        query = query.eq("user_id", user.id);
      } else if (userRole === "merchant") {
        // Get study hall IDs for merchant first
        const { data: merchantStudyHalls } = await supabase
          .from("study_halls")
          .select("id")
          .eq("merchant_id", user.id);
        
        const studyHallIds = merchantStudyHalls?.map(sh => sh.id) || [];
        if (studyHallIds.length > 0) {
          query = query.in("study_hall_id", studyHallIds);
        } else {
          setBookings([]);
          return;
        }
      }
      // Admin sees all bookings

      const { data, error } = await query.order("created_at", { ascending: false });

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
      const { data, error } = await supabase
        .from("bookings")
        .insert({
          ...bookingData,
          user_id: user.id,
          status: "pending"
        })
        .select()
        .single();

      if (error) throw error;

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
      const { error } = await supabase
        .from("bookings")
        .update({ status })
        .eq("id", bookingId);

      if (error) throw error;

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
  }, [user, userRole]);

  return {
    bookings,
    loading,
    fetchBookings,
    createBooking,
    updateBookingStatus,
    cancelBooking,
  };
};