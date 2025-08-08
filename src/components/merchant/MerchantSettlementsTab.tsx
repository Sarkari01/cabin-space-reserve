import React, { useState, useEffect } from "react";
import ErrorBoundary from "@/components/ErrorBoundary";
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
import { ExportButton } from "@/components/ui/export-button";
import { ExportColumn, formatCurrency, formatDate } from "@/utils/exportUtils";
import { useBusinessSettings } from "@/hooks/useBusinessSettings";


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

  const { settings } = useBusinessSettings();
  const minWithdrawal = Number(settings?.minimum_withdrawal_amount ?? 500);


  // Early return if user not loaded
  if (!user) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-pulse text-muted-foreground">Loading user data...</div>
      </div>
    );
  }

  // Filter settlements for current merchant with null safety
  const merchantSettlements = settlements?.filter(s => s?.merchant_id === user?.id) || [];

  // Apply additional filters with null safety
  const filteredSettlements = merchantSettlements.filter(settlement => {
    if (!settlement) return false;
    
    const matchesStatus = statusFilter === "all" || settlement.status === statusFilter;
    const matchesSearch = searchTerm === "" || 
      settlement.settlement_number?.toString()?.includes(searchTerm) ||
      settlement.payment_reference?.toLowerCase()?.includes(searchTerm.toLowerCase());
    
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
          <ErrorBoundary fallback={
            <Card>
              <CardContent className="p-6">
                <div className="text-muted-foreground">Unable to load balance data</div>
              </CardContent>
            </Card>
          }>
            <MerchantBalanceCard
              balance={balance}
              loading={withdrawalsLoading}
              onRequestWithdrawal={() => setShowWithdrawalModal(true)}
            />
          </ErrorBoundary>
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
                ₹{(settlements || [])
                  .filter(s => s?.status === 'paid')
                  .reduce((sum, s) => sum + Number(s?.net_settlement_amount || 0), 0)
                  .toLocaleString()}
              </div>
              <div className="text-sm text-muted-foreground">
                From {(settlements || []).filter(s => s?.status === 'paid').length} settlements
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
                ₹{Number(balance?.platform_fees || 0).toLocaleString()}
              </div>
              <div className="text-sm text-muted-foreground">
                All-time platform fees from earnings
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                Settled fees: ₹{(settlements || []).reduce((sum, s) => sum + Number(s?.platform_fee_amount || 0), 0).toLocaleString()}
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
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Settlement History</CardTitle>
                  <CardDescription>Your settlement records and payments</CardDescription>
                </div>
                <ExportButton
                  data={filteredSettlements.map(settlement => ({
                    settlement_number: settlement.settlement_number || 'PENDING',
                    status: settlement.status,
                    created_date: settlement.created_at,
                    total_booking_amount: settlement.total_booking_amount,
                    platform_fee_percentage: settlement.platform_fee_percentage,
                    platform_fee_amount: settlement.platform_fee_amount,
                    net_settlement_amount: settlement.net_settlement_amount,
                    payment_reference: settlement.payment_reference || 'N/A',
                    payment_method: settlement.payment_method || 'N/A',
                    payment_date: settlement.payment_date || 'N/A'
                  }))}
                  columns={[
                    { key: "settlement_number", title: "Settlement #" },
                    { key: "status", title: "Status" },
                    { key: "created_date", title: "Created Date", format: formatDate },
                    { key: "total_booking_amount", title: "Total Booking Amount", format: formatCurrency },
                    { key: "platform_fee_percentage", title: "Platform Fee %" },
                    { key: "platform_fee_amount", title: "Platform Fee Amount", format: formatCurrency },
                    { key: "net_settlement_amount", title: "Net Settlement Amount", format: formatCurrency },
                    { key: "payment_reference", title: "Payment Reference" },
                    { key: "payment_method", title: "Payment Method" },
                    { key: "payment_date", title: "Payment Date", format: (value) => value !== 'N/A' ? formatDate(value) : 'N/A' }
                  ] as ExportColumn[]}
                  filename="merchant_settlements_history"
                  title="Merchant Settlements History"
                  disabled={loading || filteredSettlements.length === 0}
                />
              </div>
            </CardHeader>
            <CardContent>
              <ErrorBoundary fallback={
                <div className="text-center space-y-4 p-6">
                  <div className="text-muted-foreground">
                    Unable to load settlements data. Please refresh the page or contact support if the issue persists.
                  </div>
                  <Button variant="outline" onClick={() => window.location.reload()}>
                    Refresh Page
                  </Button>
                </div>
              }>
                <ResponsiveTable
                  data={filteredSettlements}
                  columns={[
                    {
                      key: "settlement_number",
                      title: "Settlement #",
                      render: (value: any, item: any) => {
                        try {
                          const settlementNum = item?.settlement_number;
                          if (!settlementNum || settlementNum === 0) {
                            return (
                              <span className="text-muted-foreground">
                                #PENDING
                              </span>
                            );
                          }
                          return `#${String(settlementNum).padStart(6, '0')}`;
                        } catch (error) {
                          console.error("Error rendering settlement number:", error);
                          return <span className="text-red-500">#ERROR</span>;
                        }
                      }
                    },
                    {
                      key: "status",
                      title: "Status",
                      render: (value: any, item: any) => {
                        try {
                          return getStatusBadge(item?.status || 'unknown');
                        } catch (error) {
                          console.error("Error rendering status:", error);
                          return <Badge variant="secondary">Unknown</Badge>;
                        }
                      }
                    },
                    {
                      key: "created_at",
                      title: "Created Date",
                      render: (value: any, item: any) => {
                        try {
                          return safeFormatDate(item?.created_at, "MMM d, yyyy");
                        } catch (error) {
                          console.error("Error formatting date:", error);
                          return "Invalid Date";
                        }
                      }
                    },
                    {
                      key: "net_settlement_amount",
                      title: "Net Amount",
                      render: (value: any, item: any) => {
                        try {
                          const amount = Number(item?.net_settlement_amount || 0);
                          return `₹${amount.toFixed(2)}`;
                        } catch (error) {
                          console.error("Error formatting amount:", error);
                          return "₹0.00";
                        }
                      }
                    }
                  ]}
                  loading={loading}
                  emptyMessage="No settlements found"
                />
              </ErrorBoundary>
            </CardContent>
          </Card>
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
                <div className="flex items-center gap-2">
                  <ExportButton
                    data={(withdrawals || []).map(withdrawal => ({
                      requested_amount: withdrawal.requested_amount,
                      withdrawal_method: withdrawal.withdrawal_method,
                      status: withdrawal.status,
                      created_date: withdrawal.created_at,
                      processed_date: withdrawal.processed_at || 'N/A',
                      payment_reference: withdrawal.payment_reference || 'N/A',
                      admin_notes: withdrawal.admin_notes || 'N/A'
                    }))}
                    columns={[
                      { key: "requested_amount", title: "Amount", format: formatCurrency },
                      { key: "withdrawal_method", title: "Method" },
                      { key: "status", title: "Status" },
                      { key: "created_date", title: "Request Date", format: formatDate },
                      { key: "processed_date", title: "Processed Date", format: (value) => value !== 'N/A' ? formatDate(value) : 'N/A' },
                      { key: "payment_reference", title: "Payment Reference" },
                      { key: "admin_notes", title: "Admin Notes" }
                    ] as ExportColumn[]}
                    filename="merchant_withdrawal_requests"
                    title="Merchant Withdrawal Requests"
                    disabled={withdrawalsLoading || !withdrawals || withdrawals.length === 0}
                  />
                  <Button 
                    onClick={() => setShowWithdrawalModal(true)}
                    disabled={!balance || balance.available_balance < minWithdrawal}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Request Withdrawal
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ErrorBoundary fallback={
                <div className="p-6 text-muted-foreground">Unable to load withdrawal requests</div>
              }>
                <ResponsiveTable
                  data={withdrawals || []}
                  columns={[
                    {
                      key: "requested_amount",
                      title: "Amount",
                      render: (value: any, item: any) => {
                        try {
                          const amount = Number(item?.requested_amount || 0);
                          return (
                            <div className="font-semibold text-lg">
                              ₹{amount.toLocaleString()}
                            </div>
                          );
                        } catch (error) {
                          console.error("Error formatting withdrawal amount:", error);
                          return <div className="font-semibold text-lg">₹0</div>;
                        }
                      }
                    },
                    {
                      key: "withdrawal_method",
                      title: "Method",
                      render: (value: any, item: any) => {
                        try {
                          const method = item?.withdrawal_method?.replace("_", " ") || 'N/A';
                          return <span className="capitalize">{method}</span>;
                        } catch (error) {
                          console.error("Error formatting withdrawal method:", error);
                          return <span className="capitalize">N/A</span>;
                        }
                      }
                    },
                    {
                      key: "status",
                      title: "Status",
                      render: (value: any, item: any) => {
                        try {
                          return getWithdrawalStatusBadge(item?.status || 'unknown');
                        } catch (error) {
                          console.error("Error rendering withdrawal status:", error);
                          return <Badge variant="secondary">Unknown</Badge>;
                        }
                      }
                    },
                    {
                      key: "created_at",
                      title: "Request Date",
                      render: (value: any, item: any) => {
                        try {
                          return (
                            <div className="space-y-1">
                              <div>{safeFormatDate(item?.created_at, "MMM dd, yyyy")}</div>
                              <div className="text-sm text-muted-foreground">
                                {safeFormatTime(item?.created_at, "hh:mm a")}
                              </div>
                            </div>
                          );
                        } catch (error) {
                          console.error("Error formatting withdrawal date:", error);
                          return (
                            <div className="space-y-1">
                              <div>Invalid Date</div>
                              <div className="text-sm text-muted-foreground">--</div>
                            </div>
                          );
                        }
                      }
                    }
                  ]}
                  loading={withdrawalsLoading}
                  emptyMessage="No withdrawal requests found"
                />
              </ErrorBoundary>
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