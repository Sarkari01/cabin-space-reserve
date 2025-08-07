import React, { useState } from "react";
import { useTransactions } from "@/hooks/useTransactions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Eye, CheckCircle, XCircle, Clock, DollarSign } from "lucide-react";
import { safeFormatDistanceToNow } from "@/lib/dateUtils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { AdminTransactionDetailsModal } from "./AdminTransactionDetailsModal";

export const AdminTransactionsTab = () => {
  const { transactions, loading, updateTransactionStatus } = useTransactions("admin");
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);
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

  const handleStatusUpdate = async (transactionId: string, newStatus: "completed" | "failed") => {
    setUpdatingId(transactionId);
    await updateTransactionStatus(transactionId, newStatus);
    setUpdatingId(null);
  };

  const handleViewDetails = (transaction: any) => {
    setSelectedTransaction(transaction);
    setDetailModalOpen(true);
  };

  const filteredTransactions = transactions.filter((transaction) => {
    const matchesStatus = statusFilter === "all" || transaction.status === statusFilter;
    const matchesSearch = searchTerm === "" || 
      transaction.user?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.user?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.payment_id?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const totalRevenue = filteredTransactions
    .filter(t => t.status === "completed")
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const pendingAmount = filteredTransactions
    .filter(t => t.status === "pending")
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const totalDeposits = filteredTransactions
    .filter(t => t.status === "completed" && t.deposit_amount)
    .reduce((sum, t) => sum + Number(t.deposit_amount || 0), 0);

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
        <h3 className="text-lg font-medium">All Transactions</h3>
        <p className="text-sm text-muted-foreground">
          Manage and monitor all payment transactions across the platform
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">₹{totalRevenue.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Amount</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">₹{pendingAmount.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Deposits</CardTitle>
            <DollarSign className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">₹{totalDeposits.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Transactions</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
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
            placeholder="Search by user, email, transaction ID, or payment ID..."
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
                      <span className="font-medium">{transaction.user?.full_name || "Unknown User"}</span>
                      {" • "}
                      <span>{transaction.user?.email}</span>
                      {" • "}
                      <span>{safeFormatDistanceToNow(transaction.created_at)} ago</span>
                    </div>
                    {transaction.payment_id && (
                      <div className="text-xs text-muted-foreground font-mono">
                        Payment ID: {transaction.payment_id}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleViewDetails(transaction)}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Details
                    </Button>
                    
                    {transaction.status === "pending" && transaction.payment_method === "offline" && (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleStatusUpdate(transaction.id, "completed")}
                          disabled={updatingId === transaction.id}
                        >
                          {updatingId === transaction.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <CheckCircle className="h-4 w-4" />
                          )}
                          Mark Paid
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleStatusUpdate(transaction.id, "failed")}
                          disabled={updatingId === transaction.id}
                        >
                          <XCircle className="h-4 w-4" />
                          Mark Failed
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <AdminTransactionDetailsModal
        open={detailModalOpen}
        onOpenChange={setDetailModalOpen}
        transaction={selectedTransaction}
      />
    </div>
  );
};