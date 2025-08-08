
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
  // Additional details for richer modal display
  seat_id?: string;
  seat_row_name?: string;
  seat_number?: number;
  location_address?: string;
  location_image_url?: string;
  booking_amount?: number; // cabin-only
  deposit_amount?: number; // cabin-only
  deposit_refunded?: boolean; // cabin-only
  is_vacated?: boolean; // cabin-only
  months_booked?: number; // cabin-only
  monthly_amount?: number; // cabin-only
  user?: {
    full_name: string;
    email: string;
    phone?: string;
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
      console.log('🔍 MerchantBookings: No user found, clearing bookings');
      setBookings([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      console.log('🔍 MerchantBookings: Starting fetch for merchant', user.id);
      
      // Ensure session is valid
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        console.error('🔍 MerchantBookings: No active session for booking fetch');
        setBookings([]);
        setLoading(false);
        return;
      }

      // Skipping study hall bookings fetch - merchant dashboard is cabin-only

      // Fetch cabin bookings with correct relationship syntax
      console.log('🔍 MerchantBookings: Fetching cabin bookings...');
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
          private_hall:private_halls!cabin_bookings_private_hall_id_fkey(
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
        .eq('private_hall.merchant_id', user.id)
        .order("created_at", { ascending: false });

      if (cabinError) {
        console.error("🔍 MerchantBookings: Error fetching cabin bookings:", {
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
      } else {
        console.log('✅ MerchantBookings: Cabin bookings fetched:', cabinBookings?.length || 0);
      }

      const enrichedBookings: MerchantBooking[] = [];

      // Skipping study hall bookings processing - cabin-only mode

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
            location_address: booking.private_hall?.location,
            user: Array.isArray(booking.user) ? booking.user[0] : booking.user,
            guest_name: booking.guest_name,
            guest_phone: booking.guest_phone,
            guest_email: booking.guest_email,
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

      console.log(`✅ MerchantBookings: Successfully fetched ${enrichedBookings.length} cabin bookings for merchant ${user.id}`);
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

  // Realtime updates for bookings and cabin bookings
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('merchant-bookings')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'cabin_bookings' },
        () => {
          fetchMerchantBookings();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, fetchMerchantBookings]);

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

  const updateMerchantBookingStatus = async (bookingId: string, nextStatus: string) => {
    try {
      const booking = bookings.find(b => b.id === bookingId);
      if (!booking) {
        toast({ title: "Error", description: "Booking not found", variant: "destructive" });
        return false;
      }

      const table = booking.booking_type === 'cabin' ? 'cabin_bookings' : 'bookings';
      const { error } = await supabase
        .from(table)
        .update({ status: nextStatus, updated_at: new Date().toISOString() })
        .eq('id', bookingId);

      if (error) throw error;

      await fetchMerchantBookings();
      toast({ title: "Success", description: `Booking ${nextStatus}.` });
      return true;
    } catch (err: any) {
      console.error('Failed to update booking status', err);
      toast({ title: "Error", description: err?.message || 'Failed to update booking', variant: "destructive" });
      return false;
    }
  };

  return {
    bookings,
    loading,
    fetchMerchantBookings,
    getActiveBookings,
    getCompletedBookings,
    getPendingBookings,
    getTotalRevenue,
    updateMerchantBookingStatus,
  };
};
