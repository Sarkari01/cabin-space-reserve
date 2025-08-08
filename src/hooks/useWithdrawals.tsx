import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "./use-toast";
import { useAuth } from "./useAuth";
import type { Tables } from "@/integrations/supabase/types";

export interface WithdrawalRequest extends Tables<"withdrawal_requests"> {
  merchant?: {
    full_name: string;
    email: string;
    merchant_number: number;
  };
}

export interface MerchantBalance {
  total_earnings: number;
  platform_fees: number;
  net_earnings: number;
  pending_withdrawals: number;
  available_balance: number;
}

export const useWithdrawals = () => {
  const { toast } = useToast();
  const { user, userRole } = useAuth();
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [balance, setBalance] = useState<MerchantBalance>({
    total_earnings: 0,
    platform_fees: 0,
    net_earnings: 0,
    pending_withdrawals: 0,
    available_balance: 0,
  });

  const fetchWithdrawals = async () => {
    try {
      setLoading(true);
      
      let query = supabase
        .from("withdrawal_requests")
        .select(`
          *,
          merchant:profiles!withdrawal_requests_merchant_id_fkey(
            full_name,
            email,
            merchant_number
          )
        `)
        .order("created_at", { ascending: false });

      // For merchants, only fetch their own withdrawals
      if (userRole === "merchant") {
        query = query.eq("merchant_id", user?.id as string);
      }

      const { data, error } = await query;

      if (error) throw error;
      
      // Validate and filter out any invalid data
      const validData = (data || []).filter(withdrawal => 
        withdrawal && 
        typeof withdrawal === 'object' &&
        withdrawal.id &&
        withdrawal.merchant_id
      );
      
      setWithdrawals(validData);
    } catch (error) {
      console.error("Error fetching withdrawals:", error);
      setWithdrawals([]); // Set empty array on error
      toast({
        title: "Error",
        description: "Failed to fetch withdrawal requests",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchMerchantBalance = async (merchantId?: string) => {
    if (!merchantId && userRole !== "merchant") return;
    
    const targetMerchantId = merchantId || user?.id;
    if (!targetMerchantId) return;

    try {
      const { data, error } = await supabase.rpc("get_merchant_available_balance", {
        p_merchant_id: targetMerchantId
      });

      if (error) {
        console.error("RPC error in fetchMerchantBalance:", error);
        throw error;
      }
      
      const balanceData = data?.[0];
      if (balanceData && typeof balanceData === 'object') {
        // Enhanced validation with type checking
        const validatedBalance = {
          total_earnings: Number(balanceData.total_earnings || 0),
          platform_fees: Number(balanceData.platform_fees || 0),
          net_earnings: Number(balanceData.net_earnings || 0),
          pending_withdrawals: Number(balanceData.pending_withdrawals || 0),
          available_balance: Number(balanceData.available_balance || 0)
        };
        
        // Ensure all values are valid numbers
        Object.keys(validatedBalance).forEach(key => {
          const value = validatedBalance[key as keyof typeof validatedBalance];
          if (isNaN(value) || !isFinite(value)) {
            console.warn(`Invalid balance value for ${key}, setting to 0`);
            validatedBalance[key as keyof typeof validatedBalance] = 0;
          }
        });
        
        setBalance(validatedBalance);
      } else {
        // Set safe default balance if no data
        setBalance({
          total_earnings: 0,
          platform_fees: 0,
          net_earnings: 0,
          pending_withdrawals: 0,
          available_balance: 0
        });
      }
    } catch (error) {
      console.error("Error fetching merchant balance:", error);
      
      // Set safe default balance on error instead of null
      setBalance({
        total_earnings: 0,
        platform_fees: 0,
        net_earnings: 0,
        pending_withdrawals: 0,
        available_balance: 0
      });
      
      toast({
        title: "Error",
        description: "Failed to fetch merchant balance",
        variant: "destructive",
      });
    }
  };

  const createWithdrawalRequest = async (
    amount: number,
    withdrawalMethod: string = "bank_transfer"
  ) => {
    if (!user?.id) return false;

    try {
      // Validate withdrawal request
      const { data: validation, error: validationError } = await supabase.rpc(
        "validate_withdrawal_request",
        {
          p_merchant_id: user.id,
          p_amount: amount
        }
      );

      if (validationError) throw validationError;

      const validationResult = validation?.[0];
      if (!validationResult?.is_valid) {
        toast({
          title: "Invalid Withdrawal Request",
          description: validationResult?.error_message || "Unable to process withdrawal",
          variant: "destructive",
        });
        return false;
      }

      // Create withdrawal request
      const { error } = await supabase
        .from("withdrawal_requests")
        .insert({
          merchant_id: user.id,
          requested_amount: amount,
          withdrawal_method: withdrawalMethod
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Withdrawal request submitted successfully",
      });

      await fetchWithdrawals();
      await fetchMerchantBalance();
      return true;
    } catch (error) {
      console.error("Error creating withdrawal request:", error);
      toast({
        title: "Error",
        description: "Failed to create withdrawal request",
        variant: "destructive",
      });
      return false;
    }
  };

  const updateWithdrawalStatus = async (
    withdrawalId: string,
    status: WithdrawalRequest["status"],
    adminNotes?: string,
    paymentReference?: string,
    paymentMethod?: string
  ) => {
    try {
      const updateData: any = {
        status,
        admin_notes: adminNotes,
        processed_by: user?.id,
        processed_at: new Date().toISOString()
      };

      if (paymentReference) updateData.payment_reference = paymentReference;
      if (paymentMethod) updateData.payment_method = paymentMethod;

      const { error } = await supabase
        .from("withdrawal_requests")
        .update(updateData)
        .eq("id", withdrawalId);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Withdrawal request ${status}`,
      });

      await fetchWithdrawals();
    } catch (error) {
      console.error("Error updating withdrawal status:", error);
      toast({
        title: "Error",
        description: "Failed to update withdrawal request",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    if (user) {
      fetchWithdrawals();
      if (userRole === "merchant") {
        fetchMerchantBalance();
      }
    }
  }, [user, userRole]);

  return {
    withdrawals,
    loading,
    balance,
    fetchWithdrawals,
    fetchMerchantBalance,
    createWithdrawalRequest,
    updateWithdrawalStatus
  };
};