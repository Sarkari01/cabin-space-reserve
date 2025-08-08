
import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface SettlementRequest {
  id: string;
  merchant_id: string;
  requested_by: string;
  admin_id?: string | null;
  transaction_ids: string[];
  total_booking_amount: number;
  total_deposit_amount: number;
  total_amount: number;
  platform_fee_percentage: number;
  platform_fee_amount: number;
  net_settlement_amount: number;
  notes?: string | null;
  status: "pending" | "approved" | "rejected" | "cancelled";
  linked_settlement_id?: string | null;
  created_at: string;
  updated_at: string;
  processed_at?: string | null;
}

export const useSettlementRequests = () => {
  const { toast } = useToast();
  const [requests, setRequests] = useState<SettlementRequest[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("settlement_requests")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching settlement requests:", error);
      toast({
        title: "Error",
        description: "Failed to fetch settlement requests",
        variant: "destructive",
      });
      setRequests([]);
      setLoading(false);
      return;
    }

    setRequests((data || []) as SettlementRequest[]);
    setLoading(false);
  }, [toast]);

  const approveRequest = useCallback(
    async (requestId: string, paymentMethod?: string, paymentReference?: string) => {
      const { data, error } = await supabase.rpc("approve_settlement_request", {
        p_request_id: requestId,
        p_payment_method: paymentMethod || null,
        p_payment_reference: paymentReference || null,
      });

      if (error) {
        console.error("approve_settlement_request error:", error);
        toast({
          title: "Error",
          description: "Failed to approve request",
          variant: "destructive",
        });
        return null;
      }

      toast({ title: "Approved", description: "Settlement request approved" });
      await fetchRequests();
      return data;
    },
    [fetchRequests, toast]
  );

  const rejectRequest = useCallback(
    async (requestId: string, adminNotes?: string) => {
      const { data, error } = await supabase.rpc("reject_settlement_request", {
        p_request_id: requestId,
        p_admin_notes: adminNotes || null,
      });

      if (error) {
        console.error("reject_settlement_request error:", error);
        toast({
          title: "Error",
          description: "Failed to reject request",
          variant: "destructive",
        });
        return null;
      }

      toast({ title: "Rejected", description: "Settlement request rejected" });
      await fetchRequests();
      return data;
    },
    [fetchRequests, toast]
  );

  useEffect(() => {
    fetchRequests();
    // realtime subscription can be added later if needed
  }, [fetchRequests]);

  return {
    requests,
    loading,
    fetchRequests,
    approveRequest,
    rejectRequest,
  };
};
