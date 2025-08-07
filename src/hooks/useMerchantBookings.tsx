import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { useToast } from "./use-toast";

export interface MerchantBooking {
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
  unit_name: string;
  user?: {
    full_name: string;
    email: string;
  };
  guest_name?: string;
  guest_phone?: string;
  guest_email?: string;
}

export const useMerchantBookings = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [bookings, setBookings] = useState<MerchantBooking[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMerchantBookings = useCallback(async () => {
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
        console.error('No active session for booking fetch');
        setBookings([]);
        setLoading(false);
        return;
      }

      // Fetch study hall bookings
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
            merchant_id
          ),
          seat:seats(seat_id),
          user:profiles(full_name, email)
        `)
        .eq('study_hall.merchant_id', user.id)
        .order("created_at", { ascending: false });

      if (studyHallError) {
        console.error("Error fetching study hall bookings:", studyHallError);
      }

      // Fetch cabin bookings with correct relationship syntax
      const { data: cabinBookings, error: cabinError } = await supabase
        .from("cabin_bookings")
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
          private_hall:private_halls!private_hall_id(
            id,
            name,
            merchant_id
          ),
          cabin:cabins!cabin_id(cabin_name),
          user:profiles!user_id(full_name, email)
        `)
        .eq('private_hall.merchant_id', user.id)
        .order("created_at", { ascending: false });

      console.log('Cabin bookings query result:', { 
        cabinBookings, 
        cabinError, 
        merchantId: user.id,
        cabinBookingsCount: cabinBookings?.length || 0 
      });

      if (cabinError) {
        console.error("Error fetching cabin bookings:", {
          error: cabinError,
          code: cabinError.code,
          message: cabinError.message,
          details: cabinError.details,
          hint: cabinError.hint,
          merchantId: user.id
        });
        
        // Only show error if it's not a simple "no data" case
        if (cabinError.code !== 'PGRST116') {
          toast({
            title: "Cabin Bookings Error",
            description: `Failed to load cabin bookings: ${cabinError.message || 'Unknown error'}`,
            variant: "destructive",
          });
        }
      }

      const enrichedBookings: MerchantBooking[] = [];

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
            guest_email: booking.guest_email
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
            guest_email: booking.guest_email
          });
        }
      }

      // Sort by creation date (newest first)
      enrichedBookings.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      console.log(`Fetched ${enrichedBookings.length} combined bookings for merchant ${user.id}`);
      setBookings(enrichedBookings);

    } catch (error) {
      console.error("Error fetching merchant bookings:", error);
      toast({
        title: "Error",
        description: "Failed to fetch booking history",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  useEffect(() => {
    fetchMerchantBookings();
  }, [fetchMerchantBookings]);

  const getActiveBookings = () => {
    return bookings.filter(booking => 
      booking.status === 'active' && booking.payment_status === 'paid'
    );
  };

  const getCompletedBookings = () => {
    return bookings.filter(booking => booking.status === 'completed');
  };

  const getPendingBookings = () => {
    return bookings.filter(booking => 
      booking.status === 'pending' || booking.payment_status === 'unpaid'
    );
  };

  const getTotalRevenue = () => {
    return bookings
      .filter(booking => booking.payment_status === 'paid')
      .reduce((sum, booking) => sum + Number(booking.total_amount), 0);
  };

  return {
    bookings,
    loading,
    fetchMerchantBookings,
    getActiveBookings,
    getCompletedBookings,
    getPendingBookings,
    getTotalRevenue
  };
};