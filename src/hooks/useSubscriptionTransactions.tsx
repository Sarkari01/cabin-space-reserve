import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { useToast } from "./use-toast";

export interface SubscriptionTransaction {
  id: string;
  transaction_number?: number;
  subscription_id: string | null;
  merchant_id: string;
  amount: number;
  payment_method: "ekqr" | "offline" | "razorpay";
  payment_id: string | null;
  status: "pending" | "processing" | "completed" | "failed" | "refunded";
  payment_data: any;
  created_at: string;
  updated_at: string;
  subscription?: {
    id: string;
    plan?: {
      name: string;
      duration: string;
      price: number;
    };
    status: string;
    start_date: string;
    end_date: string | null;
  };
  merchant?: {
    full_name: string;
    email: string;
    merchant_number?: number;
  };
}

export const useSubscriptionTransactions = (forceRole?: "merchant" | "admin") => {
  const { user, userRole } = useAuth();
  const effectiveRole = forceRole || userRole;
  const { toast } = useToast();
  const [transactions, setTransactions] = useState<SubscriptionTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSubscriptionTransactions = async () => {
    if (!user) return;

    try {
      setLoading(true);
      
      // Ensure session is valid before making queries
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        console.error('No active session for subscription transaction fetch');
        setTransactions([]);
        setLoading(false);
        return;
      }
      
      let query = supabase
        .from("subscription_transactions")
        .select(`
          *,
          subscription:merchant_subscriptions(
            id,
            status,
            start_date,
            end_date,
            plan:subscription_plans(name, duration, price)
          ),
          merchant:profiles(full_name, email, merchant_number)
        `);

      if (effectiveRole === "merchant") {
        query = query.eq("merchant_id", user.id);
      }
      // Admin sees all subscription transactions

      const { data, error } = await query.order("created_at", { ascending: false });
      
      if (error) throw error;
      setTransactions((data || []) as SubscriptionTransaction[]);
    } catch (error) {
      console.error("Error fetching subscription transactions:", error);
      toast({
        title: "Error",
        description: "Failed to fetch subscription transactions",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateSubscriptionTransactionStatus = async (
    transactionId: string, 
    status: SubscriptionTransaction["status"],
    subscriptionId?: string
  ) => {
    try {
      const updates: any = { status };
      if (subscriptionId) {
        updates.subscription_id = subscriptionId;
      }

      const { error } = await supabase
        .from("subscription_transactions")
        .update(updates)
        .eq("id", transactionId);

      if (error) throw error;

      // If approving a subscription transaction, activate the subscription
      if (status === "completed") {
        const transaction = transactions.find(t => t.id === transactionId);
        if (transaction?.subscription_id || subscriptionId) {
          const subId = subscriptionId || transaction.subscription_id;
          if (subId) {
            const { error: subError } = await supabase
              .from("merchant_subscriptions")
              .update({ 
                status: "active",
                last_payment_date: new Date().toISOString(),
                next_payment_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days from now
              })
              .eq("id", subId);

            if (subError) {
              console.error("Error activating subscription:", subError);
            } else {
              toast({
                title: "Subscription Activated",
                description: "The merchant subscription has been activated successfully",
              });
            }
          }
        }
      }

      toast({
        title: "Success",
        description: "Transaction status updated successfully",
      });

      fetchSubscriptionTransactions();
      return true;
    } catch (error) {
      console.error("Error updating subscription transaction:", error);
      toast({
        title: "Error",
        description: "Failed to update transaction status",
        variant: "destructive",
      });
      return false;
    }
  };

  const createSubscriptionTransaction = async (transactionData: {
    subscription_id?: string | null;
    amount: number;
    payment_method: "ekqr" | "offline" | "razorpay";
    payment_id?: string;
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
      console.log('Creating subscription transaction with merchant_id:', user.id);
      console.log('Transaction data:', transactionData);

      const { data, error } = await supabase
        .from("subscription_transactions")
        .insert({
          ...transactionData,
          merchant_id: user.id,
          status: "pending"
        })
        .select()
        .single();

      if (error) {
        console.error('Subscription transaction creation error:', error);
        throw error;
      }

      toast({
        title: "Success",
        description: "Subscription transaction created successfully",
      });

      fetchSubscriptionTransactions();
      return data;
    } catch (error) {
      console.error("Error creating subscription transaction:", error);
      toast({
        title: "Error",
        description: `Failed to create subscription transaction: ${error?.message || 'Unknown error'}`,
        variant: "destructive",
      });
      return false;
    }
  };

  useEffect(() => {
    fetchSubscriptionTransactions();
  }, [user, effectiveRole]);

  // Enhanced real-time subscription for subscription transactions
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('subscription-transactions-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'subscription_transactions',
          filter: effectiveRole === 'merchant' ? `merchant_id=eq.${user.id}` : undefined
        },
        (payload) => {
          console.log('Real-time subscription transaction change detected:', payload);
          
          // Handle different types of changes
          if (payload.eventType === 'UPDATE') {
            console.log('Subscription transaction status updated:', payload.new);
            
            // Show toast notification for status changes
            if (payload.new?.status === 'completed') {
              toast({
                title: "Payment Approved",
                description: "Your subscription payment has been approved!",
              });
            } else if (payload.new?.status === 'failed') {
              toast({
                title: "Payment Rejected",
                description: "Your subscription payment was rejected. Please contact support.",
                variant: "destructive",
              });
            }
          }
          
          // Refetch transactions when changes occur
          fetchSubscriptionTransactions();
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
    fetchSubscriptionTransactions,
    createSubscriptionTransaction,
    updateSubscriptionTransactionStatus,
  };
};