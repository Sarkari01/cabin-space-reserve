import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { useToast } from "./use-toast";

export interface CombinedTransaction {
  id: string;
  transaction_number?: number;
  booking_id?: string;
  user_id: string;
  amount: number;
  payment_method: string;
  payment_id?: string;
  status: string;
  created_at: string;
  updated_at: string;
  payment_data?: any;
  booking_type: 'study_hall' | 'cabin';
  // Related booking data
  booking?: {
    booking_number?: number;
    start_date: string;
    end_date: string;
    location_name?: string;
    unit_name?: string;
  };
}

export const useCombinedTransactions = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [transactions, setTransactions] = useState<CombinedTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCombinedTransactions = useCallback(async () => {
    if (!user) {
      setTransactions([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      // Ensure session is valid
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        console.error('No active session for transaction fetch');
        setTransactions([]);
        setLoading(false);
        return;
      }

      // Fetch all transactions for the user
      const { data: allTransactions, error } = await supabase
        .from("transactions")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching transactions:", error);
        toast({
          title: "Error",
          description: "Failed to fetch transaction history",
          variant: "destructive",
        });
        return;
      }

      const enrichedTransactions: CombinedTransaction[] = [];

      // Process each transaction to determine its type and enrich with booking data
      for (const transaction of allTransactions || []) {
        const bookingType = (transaction.payment_data as any)?.booking_type || 'study_hall';
        
        let bookingData = null;
        
        if (transaction.booking_id) {
          if (bookingType === 'cabin') {
            // Fetch cabin booking data
            const { data: cabinBooking } = await supabase
              .from("cabin_bookings")
              .select(`
                booking_number,
                start_date,
                end_date,
                private_hall:private_halls!cabin_bookings_private_hall_id_fkey(name),
                cabin:cabins!cabin_bookings_cabin_id_fkey(cabin_name)
              `)
              .eq("id", transaction.booking_id)
              .single();

            if (cabinBooking) {
              bookingData = {
                booking_number: cabinBooking.booking_number,
                start_date: cabinBooking.start_date,
                end_date: cabinBooking.end_date,
                location_name: cabinBooking.private_hall?.name,
                unit_name: cabinBooking.cabin?.cabin_name
              };
            }
          } else {
            // Fetch study hall booking data
            const { data: studyHallBooking } = await supabase
              .from("bookings")
              .select(`
                booking_number,
                start_date,
                end_date,
                study_hall:study_halls(name),
                seat:seats(seat_id)
              `)
              .eq("id", transaction.booking_id)
              .single();

            if (studyHallBooking) {
              bookingData = {
                booking_number: studyHallBooking.booking_number,
                start_date: studyHallBooking.start_date,
                end_date: studyHallBooking.end_date,
                location_name: studyHallBooking.study_hall?.name,
                unit_name: studyHallBooking.seat?.seat_id
              };
            }
          }
        }

        enrichedTransactions.push({
          id: transaction.id,
          transaction_number: transaction.transaction_number,
          booking_id: transaction.booking_id,
          user_id: transaction.user_id,
          amount: transaction.amount,
          payment_method: transaction.payment_method,
          payment_id: transaction.payment_id,
          status: transaction.status,
          created_at: transaction.created_at,
          updated_at: transaction.updated_at,
          payment_data: transaction.payment_data,
          booking_type: bookingType,
          booking: bookingData
        });
      }

      console.log(`Fetched ${enrichedTransactions.length} combined transactions for user ${user.id}`);
      setTransactions(enrichedTransactions);

    } catch (error) {
      console.error("Error fetching combined transactions:", error);
      toast({
        title: "Error",
        description: "Failed to fetch transaction history",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  useEffect(() => {
    fetchCombinedTransactions();
  }, [fetchCombinedTransactions]);

  const getTotalSpent = () => {
    return transactions
      .filter(transaction => transaction.status === 'completed')
      .reduce((sum, transaction) => sum + Number(transaction.amount), 0);
  };

  const getPendingAmount = () => {
    return transactions
      .filter(transaction => transaction.status === 'pending')
      .reduce((sum, transaction) => sum + Number(transaction.amount), 0);
  };

  const getTransactionsByStatus = (status: string) => {
    return transactions.filter(transaction => transaction.status === status);
  };

  return {
    transactions,
    loading,
    fetchCombinedTransactions,
    getTotalSpent,
    getPendingAmount,
    getTransactionsByStatus
  };
};