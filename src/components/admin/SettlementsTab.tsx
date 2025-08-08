import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { WithdrawalManagementTab } from "./WithdrawalManagementTab";
import { useSettlements, Settlement, EligibleTransaction, UnsettledSummary } from "@/hooks/useSettlements";
import { useAdminData } from "@/hooks/useAdminData";
import { useBusinessSettings } from "@/hooks/useBusinessSettings";
import { CheckIcon, XIcon, DollarSignIcon, Users, CalendarIcon, TrendingUp } from "lucide-react";
import { safeFormatDate } from "@/lib/dateUtils";
import { ExportButton } from "@/components/ui/export-button";
import { ExportColumn, formatCurrency, formatDate } from "@/utils/exportUtils";

export function SettlementsTab() {
  const { settlements, loading, createSettlement, updateSettlementStatus, getEligibleTransactions, getUnsettledSummary } = useSettlements();
  const { merchants } = useAdminData();
  const { settings: businessSettings } = useBusinessSettings();
  const [selectedMerchant, setSelectedMerchant] = useState<string>("");
  const [eligibleTransactions, setEligibleTransactions] = useState<EligibleTransaction[]>([]);
  const [selectedTransactions, setSelectedTransactions] = useState<string[]>([]);
  const [unsettledSummary, setUnsettledSummary] = useState<UnsettledSummary | null>(null);
  const [platformFeePercentage, setPlatformFeePercentage] = useState(businessSettings?.platform_fee_percentage || 10);
  const [notes, setNotes] = useState("");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showStatusDialog, setShowStatusDialog] = useState(false);
  const [selectedSettlement, setSelectedSettlement] = useState<Settlement | null>(null);
  const [paymentReference, setPaymentReference] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");

  useEffect(() => {
    if (businessSettings?.platform_fee_percentage) {
      setPlatformFeePercentage(businessSettings.platform_fee_percentage);
    }
  }, [businessSettings]);

  const handleMerchantSelect = async (merchantId: string) => {
    setSelectedMerchant(merchantId);
    setSelectedTransactions([]);
    
    if (merchantId) {
      const [transactions, summary] = await Promise.all([
        getEligibleTransactions(merchantId),
        getUnsettledSummary(merchantId)
      ]);
      setEligibleTransactions(transactions);
      setUnsettledSummary(summary);
    } else {
      setEligibleTransactions([]);
      setUnsettledSummary(null);
    }
  };

  const handleTransactionSelect = (transactionId: string) => {
    setSelectedTransactions(prev => 
      prev.includes(transactionId) 
        ? prev.filter(id => id !== transactionId)
        : [...prev, transactionId]
    );
  };

  const calculateSettlementPreview = () => {
    const selectedTxns = eligibleTransactions.filter(t => 
      selectedTransactions.includes(t.transaction_id)
    );
    const totalAmount = selectedTxns.reduce((sum, t) => sum + t.amount, 0);
    const feeAmount = (totalAmount * platformFeePercentage) / 100;
    const netAmount = totalAmount - feeAmount;

    return { totalAmount, feeAmount, netAmount, count: selectedTxns.length };
  };

  const handleCreateSettlement = async () => {
    if (!selectedMerchant || selectedTransactions.length === 0) return;

    try {
      await createSettlement(selectedMerchant, selectedTransactions, platformFeePercentage, notes);
      setShowCreateDialog(false);
      setSelectedTransactions([]);
      setNotes("");
      // Refresh data
      await handleMerchantSelect(selectedMerchant);
    } catch (error) {
      console.error("Error creating settlement:", error);
    }
  };

  const handleStatusUpdate = async (status: Settlement["status"]) => {
    if (!selectedSettlement) return;

    try {
      await updateSettlementStatus(
        selectedSettlement.id, 
        status, 
        status === "paid" ? paymentReference : undefined,
        status === "paid" ? paymentMethod : undefined
      );
      setShowStatusDialog(false);
      setSelectedSettlement(null);
      setPaymentReference("");
      setPaymentMethod("");
    } catch (error) {
      console.error("Error updating settlement status:", error);
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

    return (
      <Badge variant={variants[status as keyof typeof variants]} className={colors[status as keyof typeof colors]}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const preview = calculateSettlementPreview();

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Settlements</CardTitle>
            <DollarSignIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{settlements.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Settlements</CardTitle>
            <CalendarIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {settlements.filter(s => s.status === "pending").length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Paid</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ₹{settlements
                .filter(s => s.status === "paid")
                .reduce((sum, s) => sum + s.net_settlement_amount, 0)
                .toFixed(2)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Merchants</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Set(settlements.map(s => s.merchant_id)).size}
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="create" className="space-y-4">
        <TabsList>
          <TabsTrigger value="create">Create Settlement</TabsTrigger>
          <TabsTrigger value="history">Settlement History</TabsTrigger>
          <TabsTrigger value="withdrawals">Withdrawal Requests</TabsTrigger>
        </TabsList>

        <TabsContent value="create" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Create New Settlement</CardTitle>
              <CardDescription>
                Select a merchant and their unsettled transactions to create a settlement batch.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="merchant">Select Merchant</Label>
                  <Select value={selectedMerchant} onValueChange={handleMerchantSelect}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a merchant..." />
                    </SelectTrigger>
                    <SelectContent>
                      {merchants.map((merchant) => (
                        <SelectItem key={merchant.id} value={merchant.id}>
                          {merchant.full_name} ({merchant.email})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="fee">Platform Fee (%)</Label>
                  <Input
                    id="fee"
                    type="number"
                    value={platformFeePercentage}
                    onChange={(e) => setPlatformFeePercentage(Number(e.target.value))}
                    min="0"
                    max="100"
                    step="0.1"
                  />
                </div>
              </div>

              {unsettledSummary && (
                <Card className="bg-muted/50">
                  <CardContent className="pt-4">
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <div className="text-2xl font-bold">{unsettledSummary.total_transactions}</div>
                        <div className="text-sm text-muted-foreground">Unsettled Transactions</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold">₹{unsettledSummary.total_amount.toFixed(2)}</div>
                        <div className="text-sm text-muted-foreground">Total Amount</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold">
                          {safeFormatDate(unsettledSummary.oldest_transaction_date, "MMM d")}
                        </div>
                        <div className="text-sm text-muted-foreground">Oldest Transaction</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {eligibleTransactions.length > 0 && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-medium">Eligible Transactions</h3>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const allSelected = selectedTransactions.length === eligibleTransactions.length;
                        setSelectedTransactions(allSelected ? [] : eligibleTransactions.map(t => t.transaction_id));
                      }}
                    >
                      {selectedTransactions.length === eligibleTransactions.length ? "Deselect All" : "Select All"}
                    </Button>
                  </div>

                  <div className="border rounded-lg">
                     <Table>
                       <TableHeader>
                         <TableRow>
                           <TableHead className="w-12"></TableHead>
                           <TableHead>Transaction ID</TableHead>
                           <TableHead>Booking ID</TableHead>
                           <TableHead>Date</TableHead>
                           <TableHead>Location</TableHead>
                           <TableHead>Customer</TableHead>
                           <TableHead>Booking Period</TableHead>
                           <TableHead className="text-right">Amount</TableHead>
                         </TableRow>
                       </TableHeader>
                      <TableBody>
                         {eligibleTransactions.map((transaction) => (
                           <TableRow key={transaction.transaction_id}>
                             <TableCell>
                               <input
                                 type="checkbox"
                                 checked={selectedTransactions.includes(transaction.transaction_id)}
                                 onChange={() => handleTransactionSelect(transaction.transaction_id)}
                               />
                             </TableCell>
                             <TableCell className="font-mono text-sm">
                               #{transaction.transaction_number || 'N/A'}
                             </TableCell>
                             <TableCell className="font-mono text-sm">
                               #{transaction.booking_number || 'N/A'}
                             </TableCell>
                              <TableCell>
                                {safeFormatDate(transaction.transaction_created_at, "MMM d, yyyy")}
                              </TableCell>
                             <TableCell>{transaction.study_hall_name}</TableCell>
                             <TableCell>{transaction.user_email}</TableCell>
                              <TableCell>
                                {safeFormatDate(transaction.booking_start_date, "MMM d")} - {safeFormatDate(transaction.booking_end_date, "MMM d")}
                              </TableCell>
                             <TableCell className="text-right">₹{transaction.amount.toFixed(2)}</TableCell>
                           </TableRow>
                         ))}
                      </TableBody>
                    </Table>
                  </div>

                  {selectedTransactions.length > 0 && (
                    <Card className="bg-primary/5 border-primary/20">
                      <CardContent className="pt-4">
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span>Selected Transactions:</span>
                            <span className="font-medium">{preview.count}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Total Booking Amount:</span>
                            <span className="font-medium">₹{preview.totalAmount.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Platform Fee ({platformFeePercentage}%):</span>
                            <span className="font-medium">-₹{preview.feeAmount.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between text-lg font-bold">
                            <span>Net Settlement Amount:</span>
                            <span>₹{preview.netAmount.toFixed(2)}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
                    <DialogTrigger asChild>
                      <Button 
                        disabled={selectedTransactions.length === 0}
                        size="lg"
                        className="w-full"
                      >
                        Create Settlement Batch
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Create Settlement</DialogTitle>
                        <DialogDescription>
                          Confirm the settlement details and add any notes.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="notes">Notes (Optional)</Label>
                          <Textarea
                            id="notes"
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Add any notes about this settlement..."
                          />
                        </div>
                        <div className="bg-muted p-4 rounded-lg space-y-2">
                          <div className="flex justify-between">
                            <span>Transactions:</span>
                            <span>{preview.count}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Net Amount:</span>
                            <span className="font-bold">₹{preview.netAmount.toFixed(2)}</span>
                          </div>
                        </div>
                        <div className="flex justify-end space-x-2">
                          <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                            Cancel
                          </Button>
                          <Button onClick={handleCreateSettlement}>
                            Create Settlement
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Settlement History</CardTitle>
                  <CardDescription>
                    View and manage all settlement batches.
                  </CardDescription>
                </div>
                <ExportButton
                  data={settlements.map(settlement => ({
                    settlement_number: settlement.settlement_number,
                    merchant_name: settlement.merchant?.full_name || 'Unknown',
                    merchant_email: settlement.merchant?.email || 'N/A',
                    status: settlement.status,
                    created_date: settlement.created_at,
                    total_booking_amount: settlement.total_booking_amount,
                    platform_fee_percentage: settlement.platform_fee_percentage,
                    platform_fee_amount: settlement.platform_fee_amount,
                    net_settlement_amount: settlement.net_settlement_amount,
                    payment_reference: settlement.payment_reference || 'N/A',
                    payment_method: settlement.payment_method || 'N/A',
                    payment_date: settlement.payment_date || 'N/A',
                    notes: settlement.notes || 'N/A'
                  }))}
                  columns={[
                    { key: "settlement_number", title: "Settlement #" },
                    { key: "merchant_name", title: "Merchant Name" },
                    { key: "merchant_email", title: "Merchant Email" },
                    { key: "status", title: "Status" },
                    { key: "created_date", title: "Created Date", format: formatDate },
                    { key: "total_booking_amount", title: "Total Booking Amount", format: formatCurrency },
                    { key: "platform_fee_percentage", title: "Platform Fee %" },
                    { key: "platform_fee_amount", title: "Platform Fee Amount", format: formatCurrency },
                    { key: "net_settlement_amount", title: "Net Settlement Amount", format: formatCurrency },
                    { key: "payment_reference", title: "Payment Reference" },
                    { key: "payment_method", title: "Payment Method" },
                    { key: "payment_date", title: "Payment Date", format: (value) => value !== 'N/A' ? formatDate(value) : 'N/A' },
                    { key: "notes", title: "Notes" }
                  ] as ExportColumn[]}
                  filename="admin_settlements_history"
                  title="Admin Settlements History"
                  disabled={loading || settlements.length === 0}
                />
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Settlement #</TableHead>
                    <TableHead>Merchant</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Net Amount</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {settlements.map((settlement) => (
                    <TableRow key={settlement.id}>
                      <TableCell className="font-medium">
                        #{settlement.settlement_number}
                      </TableCell>
                      <TableCell>
                        {settlement.merchant?.full_name || 'Unknown'}
                        <div className="text-sm text-muted-foreground">
                          {settlement.merchant?.email}
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(settlement.status)}</TableCell>
                      <TableCell>
                        {safeFormatDate(settlement.created_at, "MMM d, yyyy")}
                      </TableCell>
                      <TableCell className="text-right">
                        ₹{settlement.net_settlement_amount.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right">
                        {settlement.status === "pending" && (
                          <div className="flex justify-end space-x-1">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedSettlement(settlement);
                                setShowStatusDialog(true);
                              }}
                            >
                              Update
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="withdrawals">
          <WithdrawalManagementTab />
        </TabsContent>
      </Tabs>

      {/* Status Update Dialog */}
      <Dialog open={showStatusDialog} onOpenChange={setShowStatusDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Settlement Status</DialogTitle>
            <DialogDescription>
              Change the status of settlement #{selectedSettlement?.settlement_number}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {selectedSettlement?.status === "pending" && (
              <>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    onClick={() => handleStatusUpdate("approved")}
                    className="h-20 flex-col"
                  >
                    <CheckIcon className="h-6 w-6 mb-2" />
                    Approve
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleStatusUpdate("rejected")}
                    className="h-20 flex-col"
                  >
                    <XIcon className="h-6 w-6 mb-2" />
                    Reject
                  </Button>
                </div>
                
                <div className="space-y-4 border-t pt-4">
                  <h4 className="font-medium">Mark as Paid</h4>
                  <div className="space-y-2">
                    <Label htmlFor="payment-method">Payment Method</Label>
                    <Input
                      id="payment-method"
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      placeholder="e.g., Bank Transfer, UPI"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="payment-ref">Payment Reference</Label>
                    <Input
                      id="payment-ref"
                      value={paymentReference}
                      onChange={(e) => setPaymentReference(e.target.value)}
                      placeholder="UTR/Transaction ID"
                    />
                  </div>
                  <Button
                    onClick={() => handleStatusUpdate("paid")}
                    disabled={!paymentReference || !paymentMethod}
                    className="w-full"
                  >
                    Mark as Paid
                  </Button>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}