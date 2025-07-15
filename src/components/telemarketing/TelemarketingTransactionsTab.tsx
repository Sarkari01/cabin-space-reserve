import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useTransactions } from '@/hooks/useTransactions';
import { useAdminData } from '@/hooks/useAdminData';
import { PageHeader } from '@/components/PageHeader';
import { ResponsiveTable } from '@/components/ResponsiveTable';
import { CreditCard, User, Building, Search, Eye, DollarSign, CheckCircle, XCircle, Clock } from 'lucide-react';

export const TelemarketingTransactionsTab = () => {
  const { transactions, loading } = useTransactions("admin");
  const { users, studyHalls } = useAdminData();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [methodFilter, setMethodFilter] = useState("all");

  const filteredTransactions = transactions.filter(transaction => {
    const user = users.find(u => u.id === transaction.user_id);
    const studyHall = transaction.booking?.study_hall?.name ? null : studyHalls.find(h => h.id === transaction.booking?.id);
    
    const matchesSearch = 
      user?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      studyHall?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.id.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || transaction.status === statusFilter;
    const matchesMethod = methodFilter === "all" || transaction.payment_method === methodFilter;
    
    return matchesSearch && matchesStatus && matchesMethod;
  });

  const getUserName = (userId: string) => {
    const user = users.find(u => u.id === userId);
    return user?.full_name || 'Unknown User';
  };

  const getStudyHallName = (booking: any) => {
    if (booking?.study_hall?.name) {
      return booking.study_hall.name;
    }
    return 'Unknown Study Hall';
  };

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

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      completed: 'default',
      failed: 'destructive',
      pending: 'secondary',
      refunded: 'outline'
    };
    return variants[status] || 'outline';
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

  const transactionColumns = [
    {
      title: 'Transaction',
      key: 'transaction',
      render: (_: any, transaction: any) => (
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            {getStatusIcon(transaction?.status)}
            <span className="font-medium">₹{transaction?.amount || 0}</span>
          </div>
          <div className="text-xs text-muted-foreground">
            ID: {transaction?.id?.slice(0, 8)}...
          </div>
        </div>
      )
    },
    {
      title: 'User',
      key: 'user',
      render: (_: any, transaction: any) => (
        <div className="flex items-center text-sm">
          <User className="h-3 w-3 mr-1" />
          {getUserName(transaction?.user_id)}
        </div>
      )
    },
    {
      title: 'Study Hall',
      key: 'study_hall',
      render: (_: any, transaction: any) => (
        <div className="flex items-center text-sm">
          <Building className="h-3 w-3 mr-1" />
          {getStudyHallName(transaction?.booking)}
        </div>
      )
    },
    {
      title: 'Method',
      key: 'method',
      render: (_: any, transaction: any) => (
        <div className="flex items-center text-sm">
          <span className="mr-1">{getMethodIcon(transaction?.payment_method)}</span>
          {transaction?.payment_method}
        </div>
      )
    },
    {
      title: 'Status',
      key: 'status',
      render: (_: any, transaction: any) => (
        <Badge variant={getStatusBadge(transaction?.status || '')}>
          {transaction?.status || 'Unknown'}
        </Badge>
      )
    },
    {
      title: 'Date',
      key: 'created_at',
      render: (_: any, transaction: any) => (
        <div className="text-sm">
          {transaction?.created_at ? new Date(transaction.created_at).toLocaleDateString() : 'N/A'}
        </div>
      )
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, transaction: any) => (
        <Button
          size="sm"
          variant="outline"
          disabled={!transaction}
        >
          <Eye className="h-4 w-4 mr-1" />
          View
        </Button>
      )
    }
  ];

  const totalAmount = filteredTransactions
    .filter(t => t.status === 'completed')
    .reduce((sum, t) => sum + t.amount, 0);

  const stats = [
    {
      title: "Total Transactions",
      value: filteredTransactions.length,
      icon: CreditCard,
    },
    {
      title: "Completed Amount",
      value: `₹${totalAmount.toLocaleString()}`,
      icon: CheckCircle,
    },
    {
      title: "Pending Count",
      value: filteredTransactions.filter(t => t.status === 'pending').length,
      icon: Clock,
    },
    {
      title: "Failed Count",
      value: filteredTransactions.filter(t => t.status === 'failed').length,
      icon: XCircle,
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Transactions Management"
        description="Monitor all payment transactions"
        breadcrumbs={[
          { label: "Dashboard", href: "#", onClick: () => {} },
          { label: "Transactions", active: true }
        ]}
      />

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        {stats.map((stat, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>All Transactions</CardTitle>
            <div className="flex items-center space-x-2">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search transactions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 w-[250px]"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[120px]">
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
                <SelectTrigger className="w-[120px]">
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
          </div>
        </CardHeader>
        <CardContent>
          <ResponsiveTable
            data={filteredTransactions}
            columns={transactionColumns}
            loading={loading}
            emptyMessage="No transactions found"
          />
        </CardContent>
      </Card>
    </div>
  );
};