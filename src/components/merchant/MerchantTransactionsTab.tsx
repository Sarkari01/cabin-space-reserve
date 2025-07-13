import React, { useState } from "react";
import { useTransactions } from "@/hooks/useTransactions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Eye, CheckCircle, XCircle, Clock, DollarSign } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const MerchantTransactionsTab = () => {
  const { transactions, loading, updateTransactionStatus } = useTransactions("merchant");
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

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
    console.log('🔄 Updating transaction status:', { transactionId, newStatus });
    
    try {
      const transaction = transactions.find(t => t.id === transactionId);
      
      if (!transaction) {
        toast.error("Transaction not found");
        setUpdatingId(null);
        return;
      }

      // First, check if booking exists
      if (!transaction.booking_id) {
        console.error('❌ Cannot update transaction without booking_id');
        toast.error("Cannot confirm payment - booking not found. Please contact support.");
        setUpdatingId(null);
        return;
      }

      // For offline payments being confirmed, also update booking status
      if (transaction.payment_method === 'offline' && newStatus === 'completed') {
        console.log('✅ Confirming offline payment - updating booking status');
        
        // Update booking status to confirmed and payment_status to paid
        const { error: bookingError } = await supabase
          .from('bookings')
          .update({ 
            status: 'confirmed',
            payment_status: 'paid' 
          })
          .eq('id', transaction.booking_id);

        if (bookingError) {
          console.error('❌ Error updating booking status:', bookingError);
          toast.error("Failed to update booking status");
          setUpdatingId(null);
          return;
        }
        
        console.log('✅ Booking status updated successfully');
      }

      // Update transaction status
      const success = await updateTransactionStatus(transactionId, newStatus);
      if (success) {
        toast.success(`Payment ${newStatus === 'completed' ? 'confirmed' : 'rejected'} successfully`);
      } else {
        toast.error("Failed to update transaction status");
      }
    } catch (error) {
      console.error('❌ Error in handleStatusUpdate:', error);
      toast.error("An unexpected error occurred");
    }
    
    setUpdatingId(null);
  };

  // Only show transactions that are properly linked to bookings for merchant actions
  const filteredTransactions = transactions.filter((transaction) => {
    // Skip orphaned transactions (those without booking_id) for merchant view
    if (!transaction.booking_id) {
      console.warn('Skipping orphaned transaction:', transaction.id);
      return false;
    }
    
    const matchesStatus = statusFilter === "all" || transaction.status === statusFilter;
    const matchesSearch = searchTerm === "" || 
      transaction.user?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.user?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.booking?.study_hall?.name?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const totalRevenue = filteredTransactions
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
        <h3 className="text-lg font-medium">Payment Transactions</h3>
        <p className="text-sm text-muted-foreground">
          Track payments for your study hall bookings
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
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
            placeholder="Search by user, email, or study hall..."
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
                      <span className="font-medium">₹{Number(transaction.amount).toLocaleString()}</span>
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
                      <span>{formatDistanceToNow(new Date(transaction.created_at))} ago</span>
                    </div>
                    {transaction.booking?.study_hall?.name && (
                      <div className="text-sm text-muted-foreground">
                        Study Hall: {transaction.booking.study_hall.name}
                        {transaction.booking.seat?.seat_id && ` • Seat: ${transaction.booking.seat.seat_id}`}
                      </div>
                    )}
                  </div>
                  
                  {transaction.status === "pending" && transaction.payment_method === "offline" && (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleStatusUpdate(transaction.id, "completed")}
                        disabled={updatingId === transaction.id}
                        className="bg-success hover:bg-success/90"
                      >
                        {updatingId === transaction.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <CheckCircle className="h-4 w-4" />
                        )}
                        Confirm Payment
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleStatusUpdate(transaction.id, "failed")}
                        disabled={updatingId === transaction.id}
                      >
                        <XCircle className="h-4 w-4" />
                        Reject Payment
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};