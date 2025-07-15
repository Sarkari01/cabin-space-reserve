import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useSettlements, Settlement } from "@/hooks/useSettlements";
import { useAuth } from "@/hooks/useAuth";
import { DollarSignIcon, CalendarIcon, TrendingUp, Clock, CheckIcon, XIcon } from "lucide-react";
import { format } from "date-fns";

export function MerchantSettlementsTab() {
  const { settlements, loading, getSettlementTransactions } = useSettlements();
  const { user } = useAuth();
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSettlement, setSelectedSettlement] = useState<Settlement | null>(null);
  const [settlementTransactions, setSettlementTransactions] = useState<any[]>([]);
  const [loadingTransactions, setLoadingTransactions] = useState(false);

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
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  // Calculate summary stats
  const totalSettlements = merchantSettlements.length;
  const totalPaid = merchantSettlements
    .filter(s => s.status === "paid")
    .reduce((sum, s) => sum + s.net_settlement_amount, 0);
  const pendingAmount = merchantSettlements
    .filter(s => s.status === "pending")
    .reduce((sum, s) => sum + s.net_settlement_amount, 0);
  const avgSettlementAmount = totalSettlements > 0 ? totalPaid / totalSettlements : 0;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Settlements</CardTitle>
            <CalendarIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalSettlements}</div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Received</CardTitle>
            <DollarSignIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{totalPaid.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Paid settlements</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Amount</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{pendingAmount.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Awaiting payment</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Settlement</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{avgSettlementAmount.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Per settlement</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle>Settlement History</CardTitle>
          <CardDescription>
            View your settlement history and payment details
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <Label htmlFor="search">Search</Label>
              <Input
                id="search"
                placeholder="Search by settlement number or payment reference..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="w-full sm:w-48">
              <Label htmlFor="status">Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Settlements Table */}
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-16 bg-muted rounded-lg"></div>
                </div>
              ))}
            </div>
          ) : filteredSettlements.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Settlement #</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created Date</TableHead>
                  <TableHead>Total Amount</TableHead>
                  <TableHead>Platform Fee</TableHead>
                  <TableHead>Net Amount</TableHead>
                  <TableHead>Payment Details</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSettlements.map((settlement) => (
                  <TableRow key={settlement.id}>
                    <TableCell className="font-medium">
                      #{settlement.settlement_number}
                    </TableCell>
                    <TableCell>{getStatusBadge(settlement.status)}</TableCell>
                    <TableCell>
                      {format(new Date(settlement.created_at), "MMM d, yyyy")}
                      <div className="text-xs text-muted-foreground">
                        {format(new Date(settlement.created_at), "h:mm a")}
                      </div>
                    </TableCell>
                    <TableCell>₹{settlement.total_booking_amount.toFixed(2)}</TableCell>
                    <TableCell>
                      ₹{settlement.platform_fee_amount.toFixed(2)}
                      <div className="text-xs text-muted-foreground">
                        ({settlement.platform_fee_percentage}%)
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">
                      ₹{settlement.net_settlement_amount.toFixed(2)}
                    </TableCell>
                    <TableCell>
                      {settlement.status === "paid" ? (
                        <div>
                          <div className="text-sm font-medium">{settlement.payment_method}</div>
                          <div className="text-xs text-muted-foreground">
                            {settlement.payment_reference}
                          </div>
                          {settlement.payment_date && (
                            <div className="text-xs text-muted-foreground">
                              {format(new Date(settlement.payment_date), "MMM d, yyyy")}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewDetails(settlement)}
                      >
                        View Details
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8">
              <DollarSignIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No settlements found</h3>
              <p className="text-muted-foreground">
                {statusFilter === "all" 
                  ? "Your settlements will appear here once transactions are processed"
                  : `No settlements found with status: ${statusFilter}`
                }
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Settlement Details Modal/Card */}
      {selectedSettlement && (
        <Card>
          <CardHeader>
            <CardTitle>Settlement Details - #{selectedSettlement.settlement_number}</CardTitle>
            <CardDescription>
              Created on {format(new Date(selectedSettlement.created_at), "MMMM d, yyyy")}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label className="text-sm font-medium">Status</Label>
                <div className="mt-1">{getStatusBadge(selectedSettlement.status)}</div>
              </div>
              <div>
                <Label className="text-sm font-medium">Total Booking Amount</Label>
                <div className="mt-1 text-lg font-semibold">₹{selectedSettlement.total_booking_amount.toFixed(2)}</div>
              </div>
              <div>
                <Label className="text-sm font-medium">Platform Fee ({selectedSettlement.platform_fee_percentage}%)</Label>
                <div className="mt-1 text-lg font-semibold text-destructive">
                  -₹{selectedSettlement.platform_fee_amount.toFixed(2)}
                </div>
              </div>
            </div>

            <div className="border-t pt-4">
              <div className="flex justify-between items-center text-xl font-bold">
                <span>Net Settlement Amount:</span>
                <span className="text-primary">₹{selectedSettlement.net_settlement_amount.toFixed(2)}</span>
              </div>
            </div>

            {selectedSettlement.notes && (
              <div>
                <Label className="text-sm font-medium">Notes</Label>
                <div className="mt-1 text-sm text-muted-foreground bg-muted p-3 rounded-lg">
                  {selectedSettlement.notes}
                </div>
              </div>
            )}

            {/* Transaction Breakdown */}
            <div>
              <h4 className="font-medium mb-3">Transaction Breakdown</h4>
              {loadingTransactions ? (
                <div className="space-y-2">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="animate-pulse">
                      <div className="h-8 bg-muted rounded"></div>
                    </div>
                  ))}
                </div>
              ) : settlementTransactions.length > 0 ? (
                <div className="border rounded-lg">
                  <Table>
                     <TableHeader>
                       <TableRow>
                         <TableHead>Transaction ID</TableHead>
                         <TableHead>Booking ID</TableHead>
                         <TableHead className="text-right">Amount</TableHead>
                       </TableRow>
                     </TableHeader>
                     <TableBody>
                       {settlementTransactions.map((transaction) => (
                         <TableRow key={transaction.id}>
                           <TableCell className="font-mono text-sm">
                             #{transaction.transaction_number || 'N/A'}
                           </TableCell>
                           <TableCell className="font-mono text-sm">
                             #{transaction.booking_number || 'N/A'}
                           </TableCell>
                           <TableCell className="text-right font-medium">
                             ₹{transaction.transaction_amount.toFixed(2)}
                           </TableCell>
                         </TableRow>
                       ))}
                     </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-4 text-muted-foreground">
                  No transaction details available
                </div>
              )}
            </div>

            <div className="flex justify-end">
              <Button variant="outline" onClick={() => setSelectedSettlement(null)}>
                Close Details
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}