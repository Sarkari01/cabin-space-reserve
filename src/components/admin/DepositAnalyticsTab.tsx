import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Users, 
  Clock, 
  CheckCircle,
  Download,
  Calendar,
  Building
} from 'lucide-react';
import { format } from 'date-fns';

interface DepositMetrics {
  totalDeposits: number;
  refundedDeposits: number;
  pendingRefunds: number;
  averageDepositAmount: number;
  totalBookingsWithDeposits: number;
  refundRate: number;
  monthlyTrend: Array<{ month: string; deposits: number; refunds: number }>;
}

interface DepositTransaction {
  id: string;
  booking_number: number;
  user_name: string;
  private_hall_name: string;
  cabin_name: string;
  deposit_amount: number;
  booking_amount: number;
  total_amount: number;
  deposit_refunded: boolean;
  status: string;
  created_at: string;
  refunded_at?: string;
}

export const DepositAnalyticsTab: React.FC = () => {
  const [metrics, setMetrics] = useState<DepositMetrics | null>(null);
  const [transactions, setTransactions] = useState<DepositTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateRange, setDateRange] = useState('30d');
  const { toast } = useToast();

  useEffect(() => {
    fetchDepositAnalytics();
  }, [dateRange]);

  const fetchDepositAnalytics = async () => {
    try {
      setLoading(true);

      // Calculate date range
      const endDate = new Date();
      const startDate = new Date();
      switch (dateRange) {
        case '7d':
          startDate.setDate(endDate.getDate() - 7);
          break;
        case '30d':
          startDate.setDate(endDate.getDate() - 30);
          break;
        case '90d':
          startDate.setDate(endDate.getDate() - 90);
          break;
        case '1y':
          startDate.setFullYear(endDate.getFullYear() - 1);
          break;
      }

      // Fetch deposit transactions with related data
      const { data: cabinBookings, error } = await supabase
        .from('cabin_bookings')
        .select(`
          id,
          booking_number,
          deposit_amount,
          booking_amount,
          total_amount,
          deposit_refunded,
          status,
          created_at,
          user_id,
          guest_name,
          cabins!cabin_id (
            cabin_name,
            private_halls!private_hall_id (
              name
            )
          ),
          profiles!user_id (
            full_name
          )
        `)
        .gt('deposit_amount', 0)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString())
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching deposit analytics:', error);
        toast({
          title: "Error",
          description: "Failed to load deposit analytics.",
          variant: "destructive",
        });
        return;
      }

      // Process the data
      const processedTransactions: DepositTransaction[] = (cabinBookings || []).map(booking => ({
        id: booking.id,
        booking_number: booking.booking_number || 0,
        user_name: (booking.profiles as any)?.full_name || booking.guest_name || 'Unknown',
        private_hall_name: (booking.cabins as any)?.private_halls?.name || 'Unknown',
        cabin_name: (booking.cabins as any)?.cabin_name || 'Unknown',
        deposit_amount: booking.deposit_amount || 0,
        booking_amount: booking.booking_amount || 0,
        total_amount: booking.total_amount || 0,
        deposit_refunded: booking.deposit_refunded || false,
        status: booking.status || 'pending',
        created_at: booking.created_at,
      }));

      setTransactions(processedTransactions);

      // Calculate metrics
      const totalDeposits = processedTransactions.reduce((sum, t) => sum + t.deposit_amount, 0);
      const refundedDeposits = processedTransactions
        .filter(t => t.deposit_refunded)
        .reduce((sum, t) => sum + t.deposit_amount, 0);
      const pendingRefunds = totalDeposits - refundedDeposits;
      const averageDepositAmount = processedTransactions.length > 0 
        ? totalDeposits / processedTransactions.length 
        : 0;
      const totalBookingsWithDeposits = processedTransactions.length;
      const refundRate = totalBookingsWithDeposits > 0 
        ? (processedTransactions.filter(t => t.deposit_refunded).length / totalBookingsWithDeposits) * 100 
        : 0;

      // Calculate monthly trend (simplified)
      const monthlyTrend = []; // Would implement actual monthly aggregation

      setMetrics({
        totalDeposits,
        refundedDeposits,
        pendingRefunds,
        averageDepositAmount,
        totalBookingsWithDeposits,
        refundRate,
        monthlyTrend
      });

    } catch (error) {
      console.error('Error in fetchDepositAnalytics:', error);
      toast({
        title: "Error",
        description: "Failed to load deposit analytics.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredTransactions = transactions.filter(transaction => {
    const matchesSearch = searchTerm === '' || 
      transaction.user_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.private_hall_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.cabin_name.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'refunded' && transaction.deposit_refunded) ||
      (statusFilter === 'pending' && !transaction.deposit_refunded);
    
    return matchesSearch && matchesStatus;
  });

  const exportData = () => {
    const csvContent = [
      'Booking Number,Customer,Private Hall,Cabin,Deposit Amount,Booking Amount,Total Amount,Status,Deposit Refunded,Created Date',
      ...filteredTransactions.map(t => 
        `${t.booking_number},"${t.user_name}","${t.private_hall_name}","${t.cabin_name}",${t.deposit_amount},${t.booking_amount},${t.total_amount},"${t.status}",${t.deposit_refunded ? 'Yes' : 'No'},"${format(new Date(t.created_at), 'yyyy-MM-dd HH:mm:ss')}"`
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `deposit-analytics-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse space-y-2">
                  <div className="h-4 bg-muted rounded"></div>
                  <div className="h-8 bg-muted rounded"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Deposit Analytics</h2>
          <p className="text-muted-foreground">
            Comprehensive analysis of refundable deposits across cabin bookings
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="1y">Last year</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={exportData} variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      {metrics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="text-sm text-muted-foreground">Total Deposits</p>
                  <p className="text-2xl font-bold">₹{metrics.totalDeposits.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">
                    {metrics.totalBookingsWithDeposits} bookings
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <div>
                  <p className="text-sm text-muted-foreground">Refunded Deposits</p>
                  <p className="text-2xl font-bold text-green-600">₹{metrics.refundedDeposits.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">
                    {metrics.refundRate.toFixed(1)}% refund rate
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-yellow-600" />
                <div>
                  <p className="text-sm text-muted-foreground">Pending Refunds</p>
                  <p className="text-2xl font-bold text-yellow-600">₹{metrics.pendingRefunds.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">
                    {transactions.filter(t => !t.deposit_refunded).length} pending
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-purple-600" />
                <div>
                  <p className="text-sm text-muted-foreground">Average Deposit</p>
                  <p className="text-2xl font-bold">₹{metrics.averageDepositAmount.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">
                    per booking
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-4 flex-wrap">
        <div className="flex-1 min-w-[200px]">
          <Input
            placeholder="Search by customer, hall, or cabin..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Deposits</SelectItem>
            <SelectItem value="pending">Pending Refund</SelectItem>
            <SelectItem value="refunded">Refunded</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Transactions Table */}
      <Card>
        <CardHeader>
          <CardTitle>Deposit Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredTransactions.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No deposit transactions found
              </p>
            ) : (
              filteredTransactions.map((transaction) => (
                <div key={transaction.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm">CB{transaction.booking_number}</span>
                      <Badge variant={transaction.deposit_refunded ? 'default' : 'secondary'}>
                        {transaction.deposit_refunded ? 'Refunded' : 'Pending'}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        <span>{transaction.user_name}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Building className="h-4 w-4" />
                        <span>{transaction.private_hall_name} • {transaction.cabin_name}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        <span>{format(new Date(transaction.created_at), 'MMM dd, yyyy')}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="font-medium">
                      Deposit: ₹{transaction.deposit_amount.toLocaleString()}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Total: ₹{transaction.total_amount.toLocaleString()}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};