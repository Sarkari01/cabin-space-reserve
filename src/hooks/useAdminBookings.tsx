
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { useToast } from "./use-toast";

export interface AdminBooking {
  id: string;
  booking_number?: number;
  user_id?: string;
  start_date: string;
  end_date: string;
  total_amount: number;
  status: string;
  payment_status: string;
  created_at: string;
  updated_at: string;
  booking_type: 'study_hall' | 'cabin';
  location_name: string;
  location_address?: string;
  unit_name: string;
  // Cabin-specific breakdown
  booking_amount?: number;
  deposit_amount?: number;
  deposit_refunded?: boolean;
  is_vacated?: boolean;
  months_booked?: number;
  monthly_amount?: number;
  user?: {
    full_name: string;
    email: string;
    phone?: string;
  };
  guest_name?: string;
  guest_phone?: string;
  guest_email?: string;
  merchant_id?: string;
  merchant_name?: string;
}

export const useAdminBookings = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [bookings, setBookings] = useState<AdminBooking[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAdminBookings = useCallback(async () => {
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
        console.error('No active session for admin booking fetch');
        setBookings([]);
        setLoading(false);
        return;
      }

      // Fetch study hall bookings with merchant info
      const { data: studyHallBookings, error: studyHallError } = await supabase
        .from("bookings")
        .select(`
          id,
          booking_number,
          user_id,
          start_date,
          end_date,
          total_amount,
          status,
          payment_status,
          created_at,
          updated_at,
          guest_name,
          guest_phone,
          guest_email,
          study_hall:study_halls!inner(
            id,
            name,
            merchant_id,
            location,
            merchant:profiles!merchant_id(full_name)
          ),
          seat:seats(seat_id),
          user:profiles(full_name, email, phone)
        `)
        .order("created_at", { ascending: false });

      if (studyHallError) {
        console.error("Error fetching study hall bookings:", studyHallError);
      }

      // Fetch cabin bookings with merchant info
      const { data: cabinBookings, error: cabinError } = await supabase
        .from("cabin_bookings")
        .select(`
          id,
          booking_number,
          user_id,
          start_date,
          end_date,
          months_booked,
          monthly_amount,
          total_amount,
          status,
          payment_status,
          created_at,
          updated_at,
          guest_name,
          guest_phone,
          guest_email,
          private_hall:private_halls!cabin_bookings_private_hall_id_fkey!inner(
            id,
            name,
            merchant_id,
            location
          ),
          cabin:cabins!cabin_bookings_cabin_id_fkey(cabin_name, amenities),
          user:profiles!cabin_bookings_user_id_fkey(full_name, email, phone),
          booking_amount,
          deposit_amount,
          deposit_refunded,
          is_vacated
        `)
        .order("created_at", { ascending: false });

      if (cabinError) {
        console.error("Error fetching cabin bookings:", cabinError);
      }

      const enrichedBookings: AdminBooking[] = [];

      // Process study hall bookings
      if (studyHallBookings) {
        for (const booking of studyHallBookings) {
          enrichedBookings.push({
            id: booking.id,
            booking_number: booking.booking_number,
            user_id: booking.user_id,
            start_date: booking.start_date,
            end_date: booking.end_date,
            total_amount: booking.total_amount,
            status: booking.status,
            payment_status: booking.payment_status,
            created_at: booking.created_at,
            updated_at: booking.updated_at,
            booking_type: 'study_hall',
            location_name: booking.study_hall?.name || "Unknown Study Hall",
            unit_name: booking.seat?.seat_id || "Unknown Seat",
            user: Array.isArray(booking.user) ? booking.user[0] : booking.user,
            guest_name: booking.guest_name,
            guest_phone: booking.guest_phone,
            guest_email: booking.guest_email,
            merchant_id: booking.study_hall?.merchant_id,
            merchant_name: booking.study_hall?.merchant?.full_name || "Unknown Merchant"
          });
        }
      }

      // Process cabin bookings
      if (cabinBookings) {
        for (const booking of cabinBookings) {
          enrichedBookings.push({
            id: booking.id,
            booking_number: booking.booking_number,
            user_id: booking.user_id,
            start_date: booking.start_date,
            end_date: booking.end_date,
            total_amount: booking.total_amount,
            status: booking.status,
            payment_status: booking.payment_status,
            created_at: booking.created_at,
            updated_at: booking.updated_at,
            booking_type: 'cabin',
            location_name: booking.private_hall?.name || "Unknown Private Hall",
            unit_name: booking.cabin?.cabin_name || "Unknown Cabin",
            user: Array.isArray(booking.user) ? booking.user[0] : booking.user,
            guest_name: booking.guest_name,
            guest_phone: booking.guest_phone,
            guest_email: booking.guest_email,
            merchant_id: booking.private_hall?.merchant_id,
            merchant_name: "Merchant", // Optionally enrich later
            location_address: booking.private_hall?.location,
            booking_amount: booking.booking_amount,
            deposit_amount: booking.deposit_amount,
            deposit_refunded: booking.deposit_refunded,
            is_vacated: booking.is_vacated,
            months_booked: booking.months_booked,
            monthly_amount: booking.monthly_amount
          });
        }
      }

      // Sort by creation date (newest first)
      enrichedBookings.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      console.log(`Admin fetched ${enrichedBookings.length} combined bookings`);
      setBookings(enrichedBookings);

    } catch (error) {
      console.error("Error fetching admin bookings:", error);
      toast({
        title: "Error",
        description: "Failed to fetch booking data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  useEffect(() => {
    fetchAdminBookings();
  }, [fetchAdminBookings]);

  const updateBookingStatus = async (bookingId: string, status: string) => {
    try {
      const booking = bookings.find(b => b.id === bookingId);
      if (!booking) return false;

      const table = booking.booking_type === 'study_hall' ? 'bookings' : 'cabin_bookings';
      
      const { error } = await supabase
        .from(table)
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', bookingId);

      if (error) throw error;

      await fetchAdminBookings();
      return true;
    } catch (error) {
      console.error("Error updating booking status:", error);
      return false;
    }
  };

  return {
    bookings,
    loading,
    fetchAdminBookings,
    updateBookingStatus
  };
};
