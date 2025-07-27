import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { useToast } from "./use-toast";

export interface Booking {
  id: string;
  booking_number?: number;
  payment_status?: string;
  user_id: string | null;
  study_hall_id: string;
  seat_id: string;
  booking_period: "daily" | "weekly" | "monthly";
  start_date: string;
  end_date: string;
  total_amount: number;
  status: "pending" | "confirmed" | "cancelled" | "completed" | "refunded";
  created_at: string;
  updated_at: string;
  // Guest booking fields
  guest_name?: string | null;
  guest_email?: string | null;
  guest_phone?: string | null;
  study_hall?: {
    name: string;
    location: string;
    image_url?: string;
    hall_number?: number;
  };
  seat?: {
    seat_id: string;
    row_name: string;
    seat_number: number;
  };
  user?: {
    full_name: string;
    email: string;
    phone?: string;
    merchant_number?: number;
  };
}

export const useBookings = (forceRole?: "student" | "merchant" | "admin" | "incharge") => {
  const { user, userRole } = useAuth();
  const effectiveRole = forceRole || userRole;
  console.log("useBookings: Current user role:", userRole, "Effective role:", effectiveRole);
  const { toast } = useToast();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchBookings = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      
      // Ensure session is valid before making queries
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        console.error('No active session for booking fetch');
        setBookings([]);
        setLoading(false);
        return;
      }
      
      console.log("Fetching bookings for user:", user.id, "role:", effectiveRole, "session exists:", !!session);
      
      let query = supabase
        .from("bookings")
        .select(`
          *,
          study_hall:study_halls(name, location, image_url, hall_number),
          seat:seats(seat_id, row_name, seat_number),
          user:profiles(full_name, email, phone, merchant_number)
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
      // Admin and telemarketing_executive see all bookings
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
  }, [user, effectiveRole, userRole, toast]);

  // Set up real-time subscription for bookings with improved error handling
  useEffect(() => {
    if (!user) return;

    console.log("Setting up real-time subscription for bookings");
    
    // Initial fetch
    fetchBookings();

    // Set up real-time subscription with retry logic
    const channel = supabase
      .channel('booking-changes', {
        config: {
          presence: {
            key: user.id,
          },
        },
      })
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'bookings'
        },
        (payload) => {
          console.log('Real-time booking change:', payload);
          
          // Debounce refetch to avoid excessive calls
          const timeoutId = setTimeout(() => {
            fetchBookings();
          }, 1000);
          
          return () => clearTimeout(timeoutId);
        }
      )
      .subscribe((status) => {
        console.log('Booking subscription status:', status);
        if (status === 'CHANNEL_ERROR') {
          console.error('Failed to subscribe to booking changes');
        }
      });

    return () => {
      console.log("Cleaning up real-time subscription");
      supabase.removeChannel(channel);
    };
  }, [fetchBookings]);

  // Manual refresh function that can be called from components
  const refreshBookings = useCallback(() => {
    console.log("Manual refresh triggered");
    return fetchBookings();
  }, [fetchBookings]);

  const createBooking = async (bookingData: {
    study_hall_id: string;
    seat_id: string;
    booking_period: "daily" | "weekly" | "monthly";
    start_date: string;
    end_date: string;
    total_amount: number;
  }): Promise<Booking | false> => {
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
          status: "confirmed"
        })
        .select()
        .single();

      if (bookingError) throw bookingError;

      // Update seat availability to false (booked)
      console.log(`Marking seat ${bookingData.seat_id} as unavailable after booking creation`);
      
      const { error: seatError } = await supabase
        .from("seats")
        .update({ is_available: false })
        .eq("id", bookingData.seat_id);

      if (seatError) {
        console.error("Error updating seat availability:", seatError);
        // Still proceed with booking success message
        toast({
          title: "Booking Created",
          description: "Booking created successfully, but seat status may need refresh",
        });
      } else {
        console.log("Seat availability updated successfully after booking creation");
      }

      toast({
        title: "Success",
        description: "Booking created successfully",
      });

      // Refresh bookings to show the new one
      refreshBookings();
      return booking as Booking; // Return the actual booking object instead of true
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
        // For confirmed bookings, mark seat as unavailable
        // For cancelled/refunded bookings, mark seat as available
        const is_available = status === 'cancelled' || status === 'refunded';
        
        console.log(`Updating seat ${booking.seat_id} availability to:`, is_available);
        
        const { error: seatError } = await supabase
          .from("seats")
          .update({ is_available })
          .eq("id", booking.seat_id);

        if (seatError) {
          console.error("Error updating seat availability:", seatError);
          toast({
            title: "Warning",
            description: "Booking updated but seat status may not be current",
            variant: "destructive",
          });
        } else {
          console.log("Seat availability updated successfully");
        }
      }

      toast({
        title: "Success",
        description: "Booking status updated successfully",
      });

      // Refresh bookings to show the updated status
      refreshBookings();
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
    try {
      // First get the booking to access seat_id
      const { data: booking, error: fetchError } = await supabase
        .from("bookings")
        .select("seat_id")
        .eq("id", bookingId)
        .single();

      if (fetchError) throw fetchError;

      // Update booking status to cancelled
      const { error } = await supabase
        .from("bookings")
        .update({ status: "cancelled" })
        .eq("id", bookingId);

      if (error) throw error;

      // Mark seat as available again
      if (booking?.seat_id) {
        console.log(`Marking seat ${booking.seat_id} as available after cancellation`);
        
        const { error: seatError } = await supabase
          .from("seats")
          .update({ is_available: true })
          .eq("id", booking.seat_id);

        if (seatError) {
          console.error("Error updating seat availability:", seatError);
          toast({
            title: "Warning",
            description: "Booking cancelled but seat may not be available yet",
            variant: "destructive",
          });
        } else {
          console.log("Seat marked as available successfully");
        }
      }

      toast({
        title: "Success",
        description: "Booking cancelled successfully",
      });

      // Refresh bookings to show the updated status
      refreshBookings();
      return true;
    } catch (error) {
      console.error("Error cancelling booking:", error);
      toast({
        title: "Error",
        description: "Failed to cancel booking",
        variant: "destructive",
      });
      return false;
    }
  };

  const updateBooking = async (bookingId: string, updates: Partial<Booking>) => {
    try {
      console.log("Updating booking:", bookingId, "with updates:", updates);
      
      // First check if the booking exists and user has permission to update it
      const { data: existingBooking, error: checkError } = await supabase
        .from("bookings")
        .select("id, user_id, study_hall_id, study_hall:study_halls(merchant_id)")
        .eq("id", bookingId)
        .maybeSingle();

      if (checkError) {
        console.error("Error checking booking permissions:", checkError);
        throw new Error(`Permission check failed: ${checkError.message}`);
      }

      if (!existingBooking) {
        throw new Error("Booking not found or access denied");
      }

      console.log("Booking permission check passed, proceeding with update");

      const { data, error } = await supabase
        .from("bookings")
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq("id", bookingId)
        .select("*")
        .maybeSingle();

      if (error) {
        console.error("Database error:", error);
        if (error.code === "PGRST116") {
          throw new Error("No permission to update this booking or booking not found");
        }
        throw new Error(`Update failed: ${error.message}`);
      }

      if (!data) {
        throw new Error("Booking update returned no data - possible permission issue");
      }

      console.log("Booking updated successfully:", data);

      toast({
        title: "Success",
        description: "Booking updated successfully",
      });

      // Refresh bookings to show the updated information
      refreshBookings();
      return true;
    } catch (error) {
      console.error("Error updating booking:", error);
      toast({
        title: "Error",
        description: `Failed to update booking: ${error.message || "Unknown error"}`,
        variant: "destructive",
      });
      return false;
    }
  };

  return {
    bookings,
    loading,
    fetchBookings,
    refreshBookings, // Export the manual refresh function
    createBooking,
    updateBookingStatus,
    cancelBooking,
    updateBooking,
  };
};