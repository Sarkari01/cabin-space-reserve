import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Tables } from "@/integrations/supabase/types";

export interface Settlement extends Tables<"settlements"> {
  merchant?: {
    full_name: string;
    email: string;
    merchant_number: number;
  };
}

export interface SettlementTransaction {
  id: string;
  settlement_id: string;
  transaction_id: string;
  booking_id: string;
  transaction_amount: number;
  transaction_number?: number;
  booking_number?: number;
  created_at: string;
}

export interface EligibleTransaction {
  transaction_id: string;
  booking_id: string;
  amount: number;
  transaction_created_at: string;
  booking_start_date: string;
  booking_end_date: string;
  user_email: string;
  study_hall_name: string;
  transaction_number?: number;
  booking_number?: number;
}

export interface UnsettledSummary {
  total_transactions: number;
  total_amount: number;
  oldest_transaction_date: string;
}

export function useSettlements() {
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const fetchSettlements = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("settlements")
        .select(`
          *,
          merchant:profiles!settlements_merchant_id_fkey(
            full_name,
            email,
            merchant_number
          )
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      
      // Validate and filter out any invalid data
      const validData = (data || []).filter(settlement => 
        settlement && 
        typeof settlement === 'object' &&
        settlement.id &&
        settlement.merchant_id
      );
      
      setSettlements(validData);
    } catch (error) {
      console.error("Error fetching settlements:", error);
      setSettlements([]); // Set empty array on error
      toast({
        title: "Error",
        description: "Failed to fetch settlements",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getUnsettledSummary = async (merchantId: string): Promise<UnsettledSummary | null> => {
    try {
      const { data, error } = await supabase.rpc("get_unsettled_transactions_summary", {
        p_merchant_id: merchantId,
      });

      if (error) {
        console.error("RPC error in getUnsettledSummary:", error);
        throw error;
      }
      
      const result = data?.[0] || null;
      if (result) {
        // Validate the data structure
        const validatedResult = {
          total_transactions: Number(result.total_transactions || 0),
          total_amount: Number(result.total_amount || 0),
          oldest_transaction_date: result.oldest_transaction_date || null
        };
        return validatedResult;
      }
      return null;
    } catch (error) {
      console.error("Error fetching unsettled summary:", error);
      return {
        total_transactions: 0,
        total_amount: 0,
        oldest_transaction_date: null
      };
    }
  };

  const getEligibleTransactions = async (merchantId: string): Promise<EligibleTransaction[]> => {
    try {
      const { data, error } = await supabase.rpc("get_eligible_transactions_for_settlement", {
        p_merchant_id: merchantId,
      });

      if (error) {
        console.error("RPC error in getEligibleTransactions:", error);
        throw error;
      }
      
      // Validate and sanitize the data
      const validatedData = (data || []).map(transaction => ({
        transaction_id: transaction?.transaction_id || '',
        booking_id: transaction?.booking_id || '',
        amount: Number(transaction?.amount || 0),
        transaction_created_at: transaction?.transaction_created_at || '',
        booking_start_date: transaction?.booking_start_date || '',
        booking_end_date: transaction?.booking_end_date || '',
        user_email: transaction?.user_email || '',
        study_hall_name: transaction?.study_hall_name || '',
        transaction_number: Number(transaction?.transaction_number || 0),
        booking_number: Number(transaction?.booking_number || 0)
      }));
      
      return validatedData;
    } catch (error) {
      console.error("Error fetching eligible transactions:", error);
      return [];
    }
  };

  const createSettlement = async (
    merchantId: string,
    transactionIds: string[],
    platformFeePercentage: number,
    notes?: string
  ) => {
    if (!user) throw new Error("User not authenticated");

    try {
      // Get eligible transactions for calculation
      const transactions = await getEligibleTransactions(merchantId);
      const selectedTransactions = transactions.filter(t => 
        transactionIds.includes(t.transaction_id)
      );

      if (selectedTransactions.length === 0) {
        throw new Error("No valid transactions selected");
      }

      const totalBookingAmount = selectedTransactions.reduce((sum, t) => sum + t.amount, 0);
      const platformFeeAmount = (totalBookingAmount * platformFeePercentage) / 100;
      const netSettlementAmount = totalBookingAmount - platformFeeAmount;

      // Create settlement
      const { data: settlement, error: settlementError } = await supabase
        .from("settlements")
        .insert({
          admin_id: user.id,
          merchant_id: merchantId,
          settlement_number: 0, // Will be auto-generated by trigger
          total_booking_amount: totalBookingAmount,
          platform_fee_percentage: platformFeePercentage,
          platform_fee_amount: platformFeeAmount,
          net_settlement_amount: netSettlementAmount,
          notes,
        })
        .select()
        .single();

      if (settlementError) throw settlementError;

      // Create settlement transactions
      const settlementTransactions = selectedTransactions.map(t => ({
        settlement_id: settlement.id,
        transaction_id: t.transaction_id,
        booking_id: t.booking_id,
        transaction_amount: t.amount,
        transaction_number: t.transaction_number,
        booking_number: t.booking_number,
      }));

      const { error: transactionError } = await supabase
        .from("settlement_transactions")
        .insert(settlementTransactions);

      if (transactionError) throw transactionError;

      toast({
        title: "Success",
        description: "Settlement created successfully",
      });

      await fetchSettlements();
      return settlement;
    } catch (error) {
      console.error("Error creating settlement:", error);
      toast({
        title: "Error",
        description: "Failed to create settlement",
        variant: "destructive",
      });
      throw error;
    }
  };

  const updateSettlementStatus = async (
    settlementId: string,
    status: Settlement["status"],
    paymentReference?: string,
    paymentMethod?: string
  ) => {
    try {
      const updateData: any = {
        status,
      };

      if (status === "paid") {
        updateData.payment_reference = paymentReference;
        updateData.payment_method = paymentMethod;
        updateData.payment_date = new Date().toISOString();
      }

      const { error } = await supabase
        .from("settlements")
        .update(updateData)
        .eq("id", settlementId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Settlement status updated successfully",
      });

      await fetchSettlements();
    } catch (error) {
      console.error("Error updating settlement status:", error);
      toast({
        title: "Error",
        description: "Failed to update settlement status",
        variant: "destructive",
      });
      throw error;
    }
  };

  const getSettlementTransactions = async (settlementId: string): Promise<SettlementTransaction[]> => {
    try {
      const { data, error } = await supabase
        .from("settlement_transactions")
        .select("*")
        .eq("settlement_id", settlementId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error("Error fetching settlement transactions:", error);
      return [];
    }
  };

  useEffect(() => {
    if (user) {
      fetchSettlements();
    }
  }, [user]);

  return {
    settlements,
    loading,
    fetchSettlements,
    getUnsettledSummary,
    getEligibleTransactions,
    createSettlement,
    updateSettlementStatus,
    getSettlementTransactions,
  };
}