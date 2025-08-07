import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { useToast } from "./use-toast";

export interface Transaction {
  id: string;
  transaction_number?: number;
  booking_id: string | null;
  cabin_booking_id?: string | null;
  user_id: string;
  amount: number;
  deposit_amount?: number;
  booking_amount?: number;
  payment_method: "ekqr" | "offline" | "razorpay";
  payment_id: string | null;
  qr_id: string | null;
  status: "pending" | "processing" | "completed" | "failed" | "refunded";
  payment_data: any;
  created_at: string;
  updated_at: string;
  booking_type?: 'study_hall' | 'cabin';
  booking?: {
    id: string;
    booking_number?: number;
    study_hall?: {
      name: string;
      hall_number?: number;
    };
    seat?: {
      seat_id: string;
    };
  };
  private_hall?: {
    name: string;
  };
  cabin?: {
    cabin_name: string;
  };
  user?: {
    full_name: string;
    email: string;
    merchant_number?: number;
  };
}

export const useTransactions = (forceRole?: "student" | "merchant" | "admin" | "incharge") => {
  const { user, userRole } = useAuth();
  const effectiveRole = forceRole || userRole;
  const { toast } = useToast();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTransactions = async () => {
    if (!user) return;

    try {
      setLoading(true);
      
      // Ensure session is valid before making queries
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        console.error('No active session for transaction fetch');
        setTransactions([]);
        setLoading(false);
        return;
      }
      
      let query = supabase
        .from("transactions")
        .select(`
          *,
          booking:bookings(
            id,
            booking_number,
            study_hall:study_halls(name, hall_number),
            seat:seats(seat_id)
          ),
          user:profiles(full_name, email, merchant_number)
        `);

      if (effectiveRole === "student") {
        query = query.eq("user_id", user.id);
      } else if (effectiveRole === "merchant") {
        // Get transactions for both study hall and cabin bookings in merchant's properties
        const [studyHallRes, privateHallRes] = await Promise.all([
          supabase.from("study_halls").select("id").eq("merchant_id", user.id),
          supabase.from("private_halls").select("id").eq("merchant_id", user.id)
        ]);
        
        if (studyHallRes.error) throw studyHallRes.error;
        if (privateHallRes.error) throw privateHallRes.error;
        
        const studyHallIds = studyHallRes.data?.map(sh => sh.id) || [];
        const privateHallIds = privateHallRes.data?.map(ph => ph.id) || [];
        
        let bookingIdsArray: string[] = [];
        let cabinBookingIdsArray: string[] = [];
        
        // Get regular study hall booking IDs
        if (studyHallIds.length > 0) {
          const { data: bookingIds, error: bookingError } = await supabase
            .from("bookings")
            .select("id")
            .in("study_hall_id", studyHallIds);
          
          if (bookingError) throw bookingError;
          bookingIdsArray = bookingIds?.map(b => b.id) || [];
        }
        
        // Get cabin booking IDs
        if (privateHallIds.length > 0) {
          const { data: cabinBookingIds, error: cabinBookingError } = await supabase
            .from("cabin_bookings")
            .select("id")
            .in("private_hall_id", privateHallIds);
          
          if (cabinBookingError) throw cabinBookingError;
          cabinBookingIdsArray = cabinBookingIds?.map(cb => cb.id) || [];
        }
        
        // Filter transactions by booking IDs or cabin booking IDs
        if (bookingIdsArray.length > 0 || cabinBookingIdsArray.length > 0) {
          const orConditions = [];
          if (bookingIdsArray.length > 0) {
            orConditions.push(`booking_id.in.(${bookingIdsArray.join(',')})`);
          }
          if (cabinBookingIdsArray.length > 0) {
            orConditions.push(`cabin_booking_id.in.(${cabinBookingIdsArray.join(',')})`);
          }
          
          query = query.or(orConditions.join(','));
        } else {
          setTransactions([]);
          setLoading(false);
          return;
        }
      }
      // Admin and telemarketing_executive see all transactions

      const { data, error } = await query.order("created_at", { ascending: false });
      
      if (error) throw error;
      
      // Enrich transactions with booking type and related data
      const enrichedTransactions: Transaction[] = [];
      
      for (const transaction of data || []) {
        let private_hall = null;
        let cabin = null;
        
        // If this is a cabin booking transaction, fetch the related data
        if (transaction.cabin_booking_id) {
          const { data: cabinBookingData } = await supabase
            .from("cabin_bookings")
            .select(`
              private_hall:private_halls!cabin_bookings_private_hall_id_fkey(name),
              cabin:cabins!cabin_bookings_cabin_id_fkey(cabin_name)
            `)
            .eq("id", transaction.cabin_booking_id)
            .maybeSingle();
          
          if (cabinBookingData) {
            private_hall = cabinBookingData.private_hall;
            cabin = cabinBookingData.cabin;
          }
        }
        
        enrichedTransactions.push({
          ...transaction,
          payment_method: transaction.payment_method as "ekqr" | "offline" | "razorpay",
          booking_type: transaction.cabin_booking_id ? 'cabin' : 'study_hall',
          private_hall,
          cabin
        } as Transaction);
      }
      
      setTransactions(enrichedTransactions);
    } catch (error) {
      console.error("Error fetching transactions:", error);
      toast({
        title: "Error",
        description: "Failed to fetch transactions",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createTransaction = async (transactionData: {
    booking_id?: string;
    cabin_booking_id?: string;
    amount: number;
    deposit_amount?: number;
    booking_amount?: number;
    payment_method: "ekqr" | "offline" | "razorpay";
    payment_id?: string;
    qr_id?: string;
    payment_data?: any;
  }) => {
    if (!user?.id) {
      console.error('No authenticated user found');
      toast({
        title: "Error",
        description: "You must be logged in to create a transaction",
        variant: "destructive",
      });
      return false;
    }

    try {
      console.log('Creating transaction with user_id:', user.id);
      console.log('Transaction data:', transactionData);

      const { data, error } = await supabase
        .from("transactions")
        .insert({
          ...transactionData,
          user_id: user.id,
          status: "pending"
        })
        .select()
        .single();

      if (error) {
        console.error('Transaction creation error:', error);
        console.error('Error details:', error.message, error.details, error.hint);
        throw error;
      }

      toast({
        title: "Success",
        description: "Transaction created successfully",
      });

      fetchTransactions();
      return data;
    } catch (error) {
      console.error("Error creating transaction:", error);
      toast({
        title: "Error",
        description: `Failed to create transaction: ${error?.message || 'Unknown error'}`,
        variant: "destructive",
      });
      return false;
    }
  };

  const updateTransactionStatus = async (transactionId: string, status: Transaction["status"], paymentData?: any) => {
    try {
      const updates: any = { status };
      if (paymentData) {
        updates.payment_data = paymentData;
      }

      const { error } = await supabase
        .from("transactions")
        .update(updates)
        .eq("id", transactionId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Transaction status updated successfully",
      });

      fetchTransactions();
      return true;
    } catch (error) {
      console.error("Error updating transaction:", error);
      toast({
        title: "Error",
        description: "Failed to update transaction status",
        variant: "destructive",
      });
      return false;
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [user, effectiveRole]);

  // Enhanced real-time subscription for transactions
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('transactions-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'transactions',
          filter: effectiveRole === 'student' ? `user_id=eq.${user.id}` : undefined
        },
        (payload) => {
          console.log('Real-time transaction change detected:', payload);
          
          // Handle different types of changes
          if (payload.eventType === 'UPDATE') {
            console.log('Transaction status updated:', payload.new);
            
            // Show toast notification for status changes
            if (payload.new?.status === 'completed') {
              console.log('Payment completed successfully!');
            } else if (payload.new?.status === 'failed') {
              console.log('Payment failed!');
            }
          }
          
          // Refetch transactions when changes occur
          fetchTransactions();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, effectiveRole]);

  return {
    transactions,
    loading,
    fetchTransactions,
    createTransaction,
    updateTransactionStatus,
  };
};