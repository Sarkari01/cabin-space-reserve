import React, { useState } from "react";
import { useTransactions } from "@/hooks/useTransactions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Filter, Download, Eye, CheckCircle, XCircle, Clock, DollarSign } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export const TransactionsTab = () => {
  const { transactions, loading, updateTransactionStatus } = useTransactions("admin");
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [methodFilter, setMethodFilter] = useState("all");

  const filteredTransactions = transactions.filter(transaction => {
    const matchesSearch = 
      transaction.user?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.user?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.booking?.study_hall?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
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
        return '💳';
      case 'ekqr':
        return '📱';
      case 'offline':
        return '💵';
      default:
        return '💰';
    }
  };

  const handleStatusUpdate = async (transactionId: string, newStatus: string) => {
    const success = await updateTransactionStatus(transactionId, newStatus as any);
    if (success) {
      toast({
        title: "Status Updated",
        description: `Transaction status updated to ${newStatus}`,
      });
    }
  };

  const exportTransactions = () => {
    const csvContent = [
      ['Transaction ID', 'User', 'Amount', 'Method', 'Status', 'Date'].join(','),
      ...filteredTransactions.map(t => [
        t.id,
        t.user?.full_name || 'Unknown',
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
    a.download = `transactions_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const totalAmount = filteredTransactions
    .filter(t => t.status === 'completed')
    .reduce((sum, t) => sum + t.amount, 0);

  const stats = [
    {
      title: "Total Transactions",
      value: filteredTransactions.length.toString(),
      icon: DollarSign,
    },
    {
      title: "Completed Amount",
      value: `₹${totalAmount.toLocaleString()}`,
      icon: CheckCircle,
    },
    {
      title: "Pending Count",
      value: filteredTransactions.filter(t => t.status === 'pending').length.toString(),
      icon: Clock,
    },
    {
      title: "Failed Count",
      value: filteredTransactions.filter(t => t.status === 'failed').length.toString(),
      icon: XCircle,
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
        <h3 className="text-lg font-medium">Transaction Management</h3>
        <p className="text-sm text-muted-foreground">
          Monitor and manage all payment transactions
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
            placeholder="Search by user, email, transaction ID..."
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
              <p className="text-muted-foreground">No transactions found</p>
            </CardContent>
          </Card>
        ) : (
          filteredTransactions.map((transaction) => (
            <Card key={transaction.id}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(transaction.status)}
                        <span className="font-medium">₹{transaction.amount}</span>
                      </div>
                      <Badge variant={getStatusVariant(transaction.status)}>
                        {transaction.status}
                      </Badge>
                      <span className="text-sm">
                        {getMethodIcon(transaction.payment_method)} {transaction.payment_method}
                      </span>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      <div className="flex items-center gap-4">
                        <span>User: {transaction.user?.full_name || 'Unknown'}</span>
                        <span>•</span>
                        <span>Study Hall: {transaction.booking?.study_hall?.name || 'N/A'}</span>
                        <span>•</span>
                        <span>Seat: {transaction.booking?.seat?.seat_id || 'N/A'}</span>
                      </div>
                      <div className="flex items-center gap-4 mt-1">
                        <span>ID: {transaction.id.slice(0, 8)}...</span>
                        <span>•</span>
                        <span>Date: {new Date(transaction.created_at).toLocaleDateString()}</span>
                        {transaction.payment_id && (
                          <>
                            <span>•</span>
                            <span>Payment ID: {transaction.payment_id.slice(0, 12)}...</span>
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
                          variant="outline"
                          onClick={() => handleStatusUpdate(transaction.id, 'completed')}
                        >
                          Mark Paid
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleStatusUpdate(transaction.id, 'failed')}
                        >
                          Mark Failed
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