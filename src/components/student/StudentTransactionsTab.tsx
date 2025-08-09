import React, { useState } from "react";
import { useTransactions } from "@/hooks/useTransactions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, CheckCircle, XCircle, Clock, DollarSign, Download, Eye } from "lucide-react";
import { safeFormatDistanceToNow } from "@/lib/dateUtils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { StudentTransactionDetailsModal } from "./StudentTransactionDetailsModal";
import { exportToPDF, formatCurrency, formatDateTime } from "@/utils/exportUtils";
export const StudentTransactionsTab = () => {
  const { transactions, loading } = useTransactions("student");
  const [statusFilter, setStatusFilter] = useState("all");
  const [methodFilter, setMethodFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTransaction, setSelectedTransaction] = useState<any>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "failed":
        return <XCircle className="h-4 w-4 text-red-500" />;
      case "pending":
        return <Clock className="h-4 w-4 text-yellow-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case "completed":
        return "default" as const;
      case "failed":
        return "destructive" as const;
      case "pending":
        return "secondary" as const;
      default:
        return "outline" as const;
    }
  };

const getMethodColor = (method: string) => {
  switch (method) {
    case "razorpay":
      return "bg-blue-100 text-blue-800";
    case "ekqr":
      return "bg-purple-100 text-purple-800";
    case "offline":
      return "bg-gray-100 text-gray-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

const handleDownloadReceipt = (t: any) => {
  const data = [{
    Date: formatDateTime(t.created_at),
    "Transaction ID": t.id,
    "Payment ID": t.payment_id || "N/A",
    Method: t.payment_method?.toUpperCase(),
    Status: t.status?.toUpperCase(),
    "Total Amount": formatCurrency(Number(t.amount)),
    ...(t.booking_amount ? { "Booking Amount": formatCurrency(Number(t.booking_amount)) } : {}),
    ...(t.deposit_amount && Number(t.deposit_amount) > 0 ? { "Deposit Amount": formatCurrency(Number(t.deposit_amount)) } : {}),
    "Booking Type": t.booking_type === 'cabin' ? 'Private Hall Cabin' : 'Study Hall',
    "Location": t.booking_type === 'cabin' ? (t.private_hall?.name || 'N/A') : (t.booking?.study_hall?.name || 'N/A'),
    ...(t.booking?.seat?.seat_id ? { "Seat/Cabin": t.booking?.seat?.seat_id } : (t.cabin?.cabin_name ? { "Seat/Cabin": t.cabin.cabin_name } : {})),
  }];

  const filename = t.booking_type === 'cabin' 
    ? `Receipt_${t.private_hall?.name || 'PrivateHall'}_${t.id.slice(0,8)}`
    : `Receipt_${t.booking?.study_hall?.name || 'StudyHall'}_${t.id.slice(0,8)}`;

  exportToPDF(data as any, 
    [
      { key: "Date", title: "Date" },
      { key: "Transaction ID", title: "Transaction ID" },
      { key: "Payment ID", title: "Payment ID" },
      { key: "Method", title: "Method" },
      { key: "Status", title: "Status" },
      { key: "Total Amount", title: "Total Amount" },
      ...(t.booking_amount ? [{ key: "Booking Amount", title: "Booking Amount" }] : [] as any),
      ...(t.deposit_amount && Number(t.deposit_amount) > 0 ? [{ key: "Deposit Amount", title: "Deposit Amount" }] : [] as any),
      { key: "Booking Type", title: "Booking Type" },
      { key: "Location", title: "Location" },
      { key: "Seat/Cabin", title: "Seat/Cabin" },
    ],
    filename,
    "Payment Receipt"
  );
};

const filteredTransactions = transactions.filter((transaction) => {
  const matchesStatus = statusFilter === "all" || transaction.status === statusFilter;
  const matchesMethod = methodFilter === "all" || transaction.payment_method === methodFilter;
  const q = searchTerm.trim().toLowerCase();
  const matchesSearch =
    q === "" ||
    transaction.id.toLowerCase().includes(q) ||
    (transaction.payment_id && transaction.payment_id.toLowerCase().includes(q)) ||
    (transaction.transaction_number && `t${transaction.transaction_number}`.toLowerCase().includes(q)) ||
    (transaction.booking?.study_hall?.name && transaction.booking.study_hall.name.toLowerCase().includes(q)) ||
    (transaction.private_hall?.name && transaction.private_hall.name.toLowerCase().includes(q)) ||
    (transaction.cabin?.cabin_name && transaction.cabin.cabin_name.toLowerCase().includes(q));
  return matchesStatus && matchesMethod && matchesSearch;
});

  const totalSpent = filteredTransactions
    .filter(t => t.status === "completed")
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const pendingAmount = filteredTransactions
    .filter(t => t.status === "pending")
    .reduce((sum, t) => sum + Number(t.amount), 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Transactions & Receipts</h3>
        <p className="text-sm text-muted-foreground">
          Track payments for study halls and private hall cabins
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{totalSpent.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Payments</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">₹{pendingAmount.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Transactions</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filteredTransactions.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-4 flex-wrap">
        <div className="flex-1 min-w-[200px]">
          <Input
            placeholder="Search by hall/cabin, transaction or payment ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="failed">Failed</SelectItem>
          </SelectContent>
        </Select>
        <Select value={methodFilter} onValueChange={setMethodFilter}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Method" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Methods</SelectItem>
            <SelectItem value="razorpay">Razorpay</SelectItem>
            <SelectItem value="ekqr">EKQR</SelectItem>
            <SelectItem value="offline">Offline</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Transactions List */}
      <div className="grid gap-4">
        {filteredTransactions.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <p className="text-center text-muted-foreground">No transactions found</p>
            </CardContent>
          </Card>
        ) : (
          filteredTransactions.map((transaction) => (
            <Card key={transaction.id}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                 <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(transaction.status)}
                      <div className="flex flex-col">
                        <span className="font-medium">Total: ₹{Number(transaction.amount).toLocaleString()}</span>
                        {transaction.booking_amount && transaction.deposit_amount && Number(transaction.deposit_amount) > 0 && (
                          <div className="text-sm text-muted-foreground">
                            Booking: ₹{Number(transaction.booking_amount).toLocaleString()} + 
                            Deposit: ₹{Number(transaction.deposit_amount).toLocaleString()}
                          </div>
                        )}
                      </div>
                      <Badge variant={getStatusVariant(transaction.status)}>
                        {transaction.status}
                      </Badge>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getMethodColor(transaction.payment_method)}`}>
                        {transaction.payment_method.toUpperCase()}
                      </span>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      <span>{safeFormatDistanceToNow(transaction.created_at)} ago</span>
                      {transaction.payment_id && (
                        <>
                          {" • "}
                          <span className="font-mono text-xs">ID: {transaction.payment_id}</span>
                        </>
                      )}
                    </div>
                    {transaction.booking?.study_hall?.name && (
                      <div className="text-sm font-medium">
                        {transaction.booking.study_hall.name}
                        {transaction.booking.seat?.seat_id && ` • Seat: ${transaction.booking.seat.seat_id}`}
                      </div>
                    )}
                    {transaction.private_hall?.name && (
                      <div className="text-sm font-medium">
                        {transaction.private_hall.name}
                        {transaction.cabin?.cabin_name && ` • Cabin: ${transaction.cabin.cabin_name}`}
                      </div>
                    )}
                    {transaction.status === "pending" && transaction.payment_method === "offline" && (
                      <div className="text-sm text-yellow-600 font-medium">
                        ⚠️ Please pay at the study hall to complete your booking
                      </div>
                    )}
                  </div>
                  
                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => {
                        setSelectedTransaction(transaction);
                        setDetailModalOpen(true);
                      }}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Details
                    </Button>
                    
                    {transaction.status === "completed" && (
                      <Button size="sm" variant="outline" onClick={() => handleDownloadReceipt(transaction)}>
                        <Download className="h-4 w-4 mr-2" />
                        Receipt
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <StudentTransactionDetailsModal
        open={detailModalOpen}
        onOpenChange={setDetailModalOpen}
        transaction={selectedTransaction}
      />
    </div>
  );
};