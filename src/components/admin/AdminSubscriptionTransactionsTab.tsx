import React, { useState } from "react";
import { useSubscriptionTransactions } from "@/hooks/useSubscriptionTransactions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Filter, Download, Eye, CheckCircle, XCircle, Clock, DollarSign, AlertCircle, CreditCard } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";

export const AdminSubscriptionTransactionsTab = () => {
  const { transactions, loading, updateSubscriptionTransactionStatus } = useSubscriptionTransactions("admin");
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [methodFilter, setMethodFilter] = useState("all");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const filteredTransactions = transactions.filter(transaction => {
    const matchesSearch = 
      transaction.merchant?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.merchant?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.subscription?.plan?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.id.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || transaction.status === statusFilter;
    const matchesMethod = methodFilter === "all" || transaction.payment_method === methodFilter;
    
    return matchesSearch && matchesStatus && matchesMethod;
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'completed':
        return 'default';
      case 'failed':
        return 'destructive';
      case 'pending':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const getMethodIcon = (method: string) => {
    switch (method) {
      case 'razorpay':
        return <CreditCard className="h-4 w-4 text-blue-500" />;
      case 'ekqr':
        return <span className="text-purple-500">📱</span>;
      case 'offline':
        return <span className="text-gray-500">💵</span>;
      default:
        return <DollarSign className="h-4 w-4 text-gray-500" />;
    }
  };

  const handleStatusUpdate = async (transactionId: string, newStatus: string) => {
    setUpdatingId(transactionId);
    const success = await updateSubscriptionTransactionStatus(transactionId, newStatus as any);
    if (success && newStatus === "completed") {
      toast({
        title: "Subscription Approved",
        description: "The subscription has been activated for the merchant",
      });
    }
    setUpdatingId(null);
  };

  const exportTransactions = () => {
    const csvContent = [
      ['Transaction ID', 'Merchant', 'Plan', 'Amount', 'Method', 'Status', 'Date'].join(','),
      ...filteredTransactions.map(t => [
        t.id,
        t.merchant?.full_name || 'Unknown',
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
    a.download = `subscription_transactions_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const totalAmount = filteredTransactions
    .filter(t => t.status === 'completed')
    .reduce((sum, t) => sum + t.amount, 0);

  const pendingCount = filteredTransactions.filter(t => t.status === 'pending').length;
  const pendingOfflineCount = filteredTransactions.filter(t => t.status === 'pending' && t.payment_method === 'offline').length;

  const stats = [
    {
      title: "Total Revenue",
      value: `₹${totalAmount.toLocaleString()}`,
      icon: DollarSign,
      description: "From completed subscriptions"
    },
    {
      title: "Pending Approvals",
      value: pendingOfflineCount.toString(),
      icon: AlertCircle,
      description: "Offline payments awaiting approval"
    },
    {
      title: "All Pending",
      value: pendingCount.toString(),
      icon: Clock,
      description: "All pending transactions"
    },
    {
      title: "Total Transactions",
      value: filteredTransactions.length.toString(),
      icon: CreditCard,
      description: "All subscription transactions"
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Subscription Transaction Management</h3>
        <p className="text-sm text-muted-foreground">
          Monitor and approve merchant subscription payments
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <Card key={index}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{stat.title}</p>
                  <p className="text-xl font-bold">{stat.value}</p>
                  <p className="text-xs text-muted-foreground">{stat.description}</p>
                </div>
                <stat.icon className="h-5 w-5 text-primary" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by merchant, email, plan, transaction ID..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="failed">Failed</SelectItem>
          </SelectContent>
        </Select>
        <Select value={methodFilter} onValueChange={setMethodFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by method" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Methods</SelectItem>
            <SelectItem value="razorpay">Razorpay</SelectItem>
            <SelectItem value="ekqr">EKQR</SelectItem>
            <SelectItem value="offline">Offline</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" onClick={exportTransactions}>
          <Download className="h-4 w-4 mr-2" />
          Export
        </Button>
      </div>

      {/* Transactions List */}
      <div className="space-y-4">
        {filteredTransactions.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-muted-foreground">No subscription transactions found</p>
            </CardContent>
          </Card>
        ) : (
          filteredTransactions.map((transaction) => (
            <Card key={transaction.id} className={transaction.status === 'pending' && transaction.payment_method === 'offline' ? 'border-yellow-200 bg-yellow-50' : ''}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(transaction.status)}
                        <span className="font-medium">₹{transaction.amount.toLocaleString()}</span>
                      </div>
                      <Badge variant={getStatusVariant(transaction.status)}>
                        {transaction.status}
                      </Badge>
                      <div className="flex items-center gap-1">
                        {getMethodIcon(transaction.payment_method)}
                        <span className="text-sm">{transaction.payment_method}</span>
                      </div>
                      {transaction.status === 'pending' && transaction.payment_method === 'offline' && (
                        <Badge variant="outline" className="text-yellow-700 border-yellow-400">
                          Requires Approval
                        </Badge>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      <div className="flex items-center gap-4">
                        <span className="font-medium">Merchant: {transaction.merchant?.full_name || 'Unknown'}</span>
                        <span>•</span>
                        <span>{transaction.merchant?.email}</span>
                        <span>•</span>
                        <span>Plan: {transaction.subscription?.plan?.name || 'N/A'}</span>
                      </div>
                      <div className="flex items-center gap-4 mt-1">
                        <span>ID: {transaction.id.slice(0, 8)}...</span>
                        <span>•</span>
                        <span>Date: {formatDistanceToNow(new Date(transaction.created_at))} ago</span>
                        {transaction.payment_id && (
                          <>
                            <span>•</span>
                            <span>Payment ID: {transaction.payment_id.slice(0, 12)}...</span>
                          </>
                        )}
                        {transaction.merchant?.merchant_number && (
                          <>
                            <span>•</span>
                            <span>Merchant #: {transaction.merchant.merchant_number}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {transaction.status === 'pending' && transaction.payment_method === 'offline' && (
                      <>
                        <Button
                          size="sm"
                          onClick={() => handleStatusUpdate(transaction.id, 'completed')}
                          disabled={updatingId === transaction.id}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          {updatingId === transaction.id ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          ) : (
                            <CheckCircle className="h-4 w-4 mr-1" />
                          )}
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleStatusUpdate(transaction.id, 'failed')}
                          disabled={updatingId === transaction.id}
                          className="border-red-300 text-red-600 hover:bg-red-50"
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          Reject
                        </Button>
                      </>
                    )}
                    <Button size="sm" variant="outline">
                      <Eye className="h-4 w-4 mr-1" />
                      View
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