import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { ResponsiveTable } from "@/components/ResponsiveTable";
import { MerchantBalanceCard } from "./MerchantBalanceCard";
import { WithdrawalRequestModal } from "./WithdrawalRequestModal";
import { useSettlements, Settlement } from "@/hooks/useSettlements";
import { useWithdrawals } from "@/hooks/useWithdrawals";
import { useAuth } from "@/hooks/useAuth";
import { DollarSignIcon, CalendarIcon, TrendingUp, Clock, CheckIcon, XIcon, Download, IndianRupee } from "lucide-react";
import { safeFormatDate, safeFormatTime } from "@/lib/dateUtils";

export function MerchantSettlementsTab() {
  const { settlements, loading, getSettlementTransactions } = useSettlements();
  const { withdrawals, balance, loading: withdrawalsLoading, createWithdrawalRequest } = useWithdrawals();
  const { user } = useAuth();
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSettlement, setSelectedSettlement] = useState<Settlement | null>(null);
  const [settlementTransactions, setSettlementTransactions] = useState<any[]>([]);
  const [loadingTransactions, setLoadingTransactions] = useState(false);
  const [showWithdrawalModal, setShowWithdrawalModal] = useState(false);

  // Filter settlements for current merchant
  const merchantSettlements = settlements.filter(s => s.merchant_id === user?.id);

  // Apply additional filters
  const filteredSettlements = merchantSettlements.filter(settlement => {
    const matchesStatus = statusFilter === "all" || settlement.status === statusFilter;
    const matchesSearch = searchTerm === "" || 
      settlement.settlement_number.toString().includes(searchTerm) ||
      settlement.payment_reference?.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesStatus && matchesSearch;
  });

  const handleViewDetails = async (settlement: Settlement) => {
    setSelectedSettlement(settlement);
    setLoadingTransactions(true);
    try {
      const transactions = await getSettlementTransactions(settlement.id);
      setSettlementTransactions(transactions);
    } catch (error) {
      console.error("Error fetching settlement transactions:", error);
    } finally {
      setLoadingTransactions(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      pending: "secondary",
      approved: "default", 
      paid: "default",
      rejected: "destructive"
    } as const;

    const colors = {
      pending: "bg-amber-100 text-amber-800",
      approved: "bg-blue-100 text-blue-800",
      paid: "bg-emerald-100 text-emerald-800", 
      rejected: "bg-red-100 text-red-800"
    };

    const icons = {
      pending: Clock,
      approved: CheckIcon,
      paid: CheckIcon,
      rejected: XIcon
    };

    const Icon = icons[status as keyof typeof icons];

    return (
      <Badge variant={variants[status as keyof typeof variants]} className={colors[status as keyof typeof colors]}>
        <Icon className="h-3 w-3 mr-1" />
        {status ? status.charAt(0).toUpperCase() + status.slice(1) : 'Unknown'}
      </Badge>
    );
  };

  const handleWithdrawalRequest = async (amount: number, method: string) => {
    return await createWithdrawalRequest(amount, method);
  };

  const getWithdrawalStatusBadge = (status: string) => {
    const variants = {
      pending: { variant: "secondary" as const, icon: Clock, color: "text-yellow-600" },
      approved: { variant: "default" as const, icon: CheckIcon, color: "text-blue-600" },
      processing: { variant: "default" as const, icon: Clock, color: "text-blue-600" },
      completed: { variant: "default" as const, icon: CheckIcon, color: "text-green-600" },
      rejected: { variant: "destructive" as const, icon: XIcon, color: "text-red-600" }
    };
    
    const config = variants[status as keyof typeof variants] || variants.pending;
    const Icon = config.icon;
    
    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {status ? status.charAt(0).toUpperCase() + status.slice(1) : 'Unknown'}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* Balance Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <MerchantBalanceCard
            balance={balance}
            loading={withdrawalsLoading}
            onRequestWithdrawal={() => setShowWithdrawalModal(true)}
          />
        </div>
        
        <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <DollarSignIcon className="h-4 w-4" />
                Total Settled
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ₹{settlements.filter(s => s.status === 'paid').reduce((sum, s) => sum + Number(s.net_settlement_amount), 0).toLocaleString()}
              </div>
              <div className="text-sm text-muted-foreground">
                From {settlements.filter(s => s.status === 'paid').length} settlements
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Platform Fees
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ₹{settlements.reduce((sum, s) => sum + Number(s.platform_fee_amount), 0).toLocaleString()}
              </div>
              <div className="text-sm text-muted-foreground">
                Total deducted
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Tabs defaultValue="settlements" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="settlements">Settlement History</TabsTrigger>
          <TabsTrigger value="withdrawals">Withdrawal Requests</TabsTrigger>
        </TabsList>

        <TabsContent value="settlements">
          <ResponsiveTable
            data={filteredSettlements}
            columns={[
              {
                key: "settlement_number",
                title: "Settlement #",
                render: (item: any) => `#${item.settlement_number}`
              },
              {
                key: "status",
                title: "Status",
                render: (item: any) => getStatusBadge(item.status)
              },
              {
                key: "created_at",
                title: "Created Date",
                render: (item: any) => safeFormatDate(item.created_at, "MMM d, yyyy")
              },
              {
                key: "net_settlement_amount",
                title: "Net Amount",
                render: (item: any) => `₹${Number(item.net_settlement_amount).toFixed(2)}`
              }
            ]}
            loading={loading}
            emptyMessage="No settlements found"
          />
        </TabsContent>

        <TabsContent value="withdrawals">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Download className="h-5 w-5" />
                    Withdrawal Requests
                  </CardTitle>
                  <CardDescription>
                    Track your withdrawal requests and their status
                  </CardDescription>
                </div>
                <Button 
                  onClick={() => setShowWithdrawalModal(true)}
                  disabled={!balance || balance.available_balance <= 0}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Request Withdrawal
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <ResponsiveTable
                data={withdrawals}
                columns={[
                  {
                    key: "amount",
                    title: "Amount",
                    render: (item: any) => (
                      <div className="font-semibold text-lg">
                        ₹{Number(item.requested_amount).toLocaleString()}
                      </div>
                    )
                  },
                  {
                    key: "method",
                    title: "Method",
                    render: (item: any) => (
                      <span className="capitalize">{item.withdrawal_method.replace("_", " ")}</span>
                    )
                  },
                  {
                    key: "status",
                    title: "Status",
                    render: (item: any) => getWithdrawalStatusBadge(item.status)
                  },
                  {
                    key: "date",
                    title: "Request Date",
                    render: (item: any) => (
                      <div className="space-y-1">
                        <div>{safeFormatDate(item.created_at, "MMM dd, yyyy")}</div>
                        <div className="text-sm text-muted-foreground">
                          {safeFormatTime(item.created_at, "hh:mm a")}
                        </div>
                      </div>
                    )
                  }
                ]}
                loading={withdrawalsLoading}
                emptyMessage="No withdrawal requests found"
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <WithdrawalRequestModal
        open={showWithdrawalModal}
        onOpenChange={setShowWithdrawalModal}
        balance={balance}
        onSubmit={handleWithdrawalRequest}
      />
    </div>
  );
}