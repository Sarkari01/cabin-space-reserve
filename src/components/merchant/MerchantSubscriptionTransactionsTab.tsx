import React, { useState } from "react";
import { useSubscriptionTransactions } from "@/hooks/useSubscriptionTransactions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Eye, CheckCircle, XCircle, Clock, DollarSign, CreditCard, AlertCircle, Download, Receipt } from "lucide-react";
import { safeFormatDistanceToNow } from "@/lib/dateUtils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";

export const MerchantSubscriptionTransactionsTab = () => {
  const { transactions, loading } = useSubscriptionTransactions("merchant");
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

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

  const getMethodIcon = (method: string) => {
    switch (method) {
      case "razorpay":
        return <CreditCard className="h-4 w-4 text-blue-500" />;
      case "ekqr":
        return <span className="text-purple-500">📱</span>;
      case "offline":
        return <span className="text-gray-500">💵</span>;
      default:
        return <DollarSign className="h-4 w-4 text-gray-500" />;
    }
  };

  const filteredTransactions = transactions.filter((transaction) => {
    const matchesStatus = statusFilter === "all" || transaction.status === statusFilter;
    const matchesSearch = searchTerm === "" || 
      transaction.subscription?.plan?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.id.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const totalPaid = filteredTransactions
    .filter(t => t.status === "completed")
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const pendingAmount = filteredTransactions
    .filter(t => t.status === "pending")
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const pendingOfflineCount = filteredTransactions
    .filter(t => t.status === "pending" && t.payment_method === "offline").length;

  const exportTransactions = () => {
    const csvContent = [
      ['Transaction ID', 'Plan', 'Amount', 'Method', 'Status', 'Date'].join(','),
      ...filteredTransactions.map(t => [
        t.id.slice(0, 8),
        t.subscription?.plan?.name || 'N/A',
        t.amount,
        t.payment_method,
        t.status,
        new Date(t.created_at).toLocaleDateString()
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `my_subscription_transactions_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

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
        <h3 className="text-lg font-medium">Subscription Transactions</h3>
        <p className="text-sm text-muted-foreground">
          View your subscription payment history and status
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Paid</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">₹{totalPaid.toLocaleString()}</div>
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
            <CardTitle className="text-sm font-medium">Awaiting Approval</CardTitle>
            <AlertCircle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{pendingOfflineCount}</div>
            <p className="text-xs text-muted-foreground">Offline payments</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Transactions</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
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
            placeholder="Search by plan or transaction ID..."
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
        <Button variant="outline" onClick={exportTransactions}>
          <Download className="h-4 w-4 mr-2" />
          Export
        </Button>
      </div>

      {/* Transactions List */}
      <div className="grid gap-4">
        {filteredTransactions.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <p className="text-center text-muted-foreground">No subscription transactions found</p>
            </CardContent>
          </Card>
        ) : (
          filteredTransactions.map((transaction) => (
            <Card key={transaction.id} className={transaction.status === 'pending' && transaction.payment_method === 'offline' ? 'border-yellow-200 bg-yellow-50' : ''}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(transaction.status)}
                      <span className="font-medium">₹{Number(transaction.amount).toLocaleString()}</span>
                      <Badge variant={getStatusVariant(transaction.status)}>
                        {transaction.status}
                      </Badge>
                      <div className="flex items-center gap-1">
                        {getMethodIcon(transaction.payment_method)}
                        <span className="text-sm">{transaction.payment_method.toUpperCase()}</span>
                      </div>
                      {transaction.status === 'pending' && transaction.payment_method === 'offline' && (
                        <Badge variant="outline" className="text-yellow-700 border-yellow-400">
                          Awaiting Admin Approval
                        </Badge>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      <div className="flex items-center gap-4">
                        <span className="font-medium">Plan: {transaction.subscription?.plan?.name || "Unknown Plan"}</span>
                        <span>•</span>
                        <span>Duration: {transaction.subscription?.plan?.duration || "N/A"}</span>
                        <span>•</span>
                        <span>{safeFormatDistanceToNow(transaction.created_at)} ago</span>
                      </div>
                      <div className="flex items-center gap-4 mt-1">
                        <span>Transaction: {transaction.id.slice(0, 8)}...</span>
                        {transaction.payment_id && (
                          <>
                            <span>•</span>
                            <span>Payment ID: {transaction.payment_id.slice(0, 12)}...</span>
                          </>
                        )}
                        {transaction.transaction_number && (
                          <>
                            <span>•</span>
                            <span>#{transaction.transaction_number}</span>
                          </>
                        )}
                      </div>
                    </div>
                    {transaction.status === 'pending' && transaction.payment_method === 'offline' && (
                      <div className="text-sm text-yellow-700 bg-yellow-100 p-2 rounded-md">
                        <AlertCircle className="h-4 w-4 inline mr-1" />
                        Your offline payment is being reviewed by our admin team. You will be notified once approved.
                      </div>
                    )}
                  </div>
                  
                  <div className="flex gap-2">
                    {transaction.status === "completed" && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          // Generate receipt functionality could be added here
                          console.log("Generate receipt for:", transaction.id);
                        }}
                      >
                        <Receipt className="h-4 w-4 mr-1" />
                        Receipt
                      </Button>
                    )}
                    <Button size="sm" variant="outline">
                      <Eye className="h-4 w-4 mr-1" />
                      Details
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};