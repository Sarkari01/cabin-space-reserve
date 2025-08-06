import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useReports, ReportFilter } from '@/hooks/useReports';
import { useCombinedBookings } from '@/hooks/useCombinedBookings';
import { useCombinedTransactions } from '@/hooks/useCombinedTransactions';
import { ReportCard } from './ReportCard';
import { ReportFilters } from './ReportFilters';
import { formatCurrency, formatDate, formatDateTime } from '@/utils/exportUtils';
import { ResponsiveTable } from '@/components/ResponsiveTable';
import { Badge } from '@/components/ui/badge';

export const StudentReportsTab: React.FC = () => {
  const { 
    loading,
    fetchBookingsReport,
    fetchTransactionsReport,
    fetchRewardsReport
  } = useReports();
  
  const { bookings: combinedBookings, loading: bookingsLoading } = useCombinedBookings();
  const { transactions: combinedTransactions, loading: transactionsLoading } = useCombinedTransactions();

  const [activeReport, setActiveReport] = useState('bookings');
  const [filters, setFilters] = useState<ReportFilter>({});
  const [reportData, setReportData] = useState<any[]>([]);

  const loadReportData = async () => {
    switch (activeReport) {
      case 'bookings':
        // Use combined bookings for comprehensive data
        setReportData(combinedBookings);
        break;
      case 'payments':
        // Use combined transactions for comprehensive data
        setReportData(combinedTransactions);
        break;
      case 'rewards':
        const rewards = await fetchRewardsReport(filters);
        setReportData(rewards);
        break;
      case 'status':
        // Group combined bookings by status for status report
        const groupedData = combinedBookings.reduce((acc: any, booking: any) => {
          const status = booking.status;
          if (!acc[status]) {
            acc[status] = [];
          }
          acc[status].push(booking);
          return acc;
        }, {});
        
        // Convert to array format for display
        const statusData = Object.keys(groupedData).map(status => ({
          status,
          count: groupedData[status].length,
          total_amount: groupedData[status].reduce((sum: number, booking: any) => sum + Number(booking.total_amount), 0),
          bookings: groupedData[status]
        }));
        setReportData(statusData);
        break;
    }
  };

  useEffect(() => {
    loadReportData();
  }, [activeReport, filters, combinedBookings, combinedTransactions]);

  const getColumns = () => {
    switch (activeReport) {
      case 'bookings':
        return [
          { key: 'booking_number', title: 'Booking ID', format: (value: any) => value ? `B${value}` : 'Pending' },
          { key: 'location.name', title: 'Location Name' },
          { key: 'location.location', title: 'Address' },
          { key: 'unit.name', title: 'Unit' },
          { key: 'type', title: 'Type', format: (value: string) => value === 'cabin' ? 'Private Cabin' : 'Study Hall' },
          { key: 'start_date', title: 'Start Date', format: formatDate },
          { key: 'end_date', title: 'End Date', format: formatDate },
          { key: 'total_amount', title: 'Amount', format: formatCurrency },
          { key: 'status', title: 'Status' },
          { key: 'payment_status', title: 'Payment' },
          { key: 'created_at', title: 'Booked On', format: formatDateTime }
        ];
      case 'payments':
        return [
          { key: 'transaction_number', title: 'Transaction ID', format: (value: any) => value ? `T${value}` : 'Pending' },
          { key: 'booking.booking_number', title: 'Booking ID', format: (value: any) => value ? `B${value}` : 'N/A' },
          { key: 'amount', title: 'Amount', format: formatCurrency },
          { key: 'payment_method', title: 'Payment Method' },
          { key: 'status', title: 'Status' },
          { key: 'created_at', title: 'Date', format: formatDateTime }
        ];
      case 'rewards':
        return [
          { key: 'type', title: 'Type' },
          { key: 'points', title: 'Points' },
          { key: 'reason', title: 'Reason' },
          { key: 'booking.booking_number', title: 'Booking', format: (value: any) => value ? `B${value}` : 'N/A' },
          { key: 'created_at', title: 'Date', format: formatDateTime }
        ];
      case 'status':
        return [
          { key: 'status', title: 'Booking Status' },
          { key: 'count', title: 'Count' },
          { key: 'total_amount', title: 'Total Amount', format: formatCurrency }
        ];
      default:
        return [];
    }
  };

  const getTableColumns = () => {
    switch (activeReport) {
      case 'bookings':
        return [
          {
            key: 'booking_number',
            title: 'Booking ID',
            render: (value: any) => (
              <span className="font-mono text-sm">
                {value ? `B${value}` : 'Pending'}
              </span>
            )
          },
          {
            key: 'study_hall',
            title: 'Study Hall',
            render: (value: any) => (
              <div>
                <div className="font-medium">{value?.name}</div>
                <div className="text-sm text-muted-foreground">{value?.location}</div>
              </div>
            )
          },
          {
            key: 'start_date',
            title: 'Period',
            render: (value: string, row: any) => (
              <div>
                <div className="text-sm">{formatDate(value)}</div>
                <div className="text-sm text-muted-foreground">to {formatDate(row.end_date)}</div>
              </div>
            )
          },
          {
            key: 'total_amount',
            title: 'Amount',
            render: (value: number) => formatCurrency(value)
          },
          {
            key: 'status',
            title: 'Status',
            render: (value: string) => (
              <Badge variant={
                value === 'completed' ? 'default' : 
                value === 'confirmed' ? 'secondary' :
                value === 'cancelled' ? 'destructive' : 'outline'
              }>
                {value}
              </Badge>
            )
          }
        ];
      case 'status':
        return [
          {
            key: 'status',
            title: 'Status',
            render: (value: string) => (
              <Badge variant={
                value === 'completed' ? 'default' : 
                value === 'confirmed' ? 'secondary' :
                value === 'cancelled' ? 'destructive' : 'outline'
              }>
                {value}
              </Badge>
            )
          },
          {
            key: 'count',
            title: 'Bookings',
            render: (value: number) => `${value} booking${value !== 1 ? 's' : ''}`
          },
          {
            key: 'total_amount',
            title: 'Total Amount',
            render: (value: number) => formatCurrency(value)
          }
        ];
      default:
        return [];
    }
  };

  const statusOptions = [
    { value: 'upcoming', label: 'Upcoming' },
    { value: 'completed', label: 'Completed' },
    { value: 'cancelled', label: 'Cancelled' }
  ];

  const paymentMethodOptions = [
    { value: 'razorpay', label: 'Razorpay' },
    { value: 'ekqr', label: 'EKQR' },
    { value: 'offline', label: 'Offline' }
  ];

  const getReportTitle = () => {
    switch (activeReport) {
      case 'bookings': return 'My Bookings Summary';
      case 'payments': return 'Payment History';
      case 'rewards': return 'Rewards & Points History';
      case 'status': return 'Booking Status Report';
      default: return 'Report';
    }
  };

  const getReportDescription = () => {
    switch (activeReport) {
      case 'bookings': return 'Complete history of all your study hall bookings';
      case 'payments': return 'Your payment transactions and billing history';
      case 'rewards': return 'Points earned and rewards redeemed';
      case 'status': return 'Overview of bookings by status (upcoming, completed, cancelled)';
      default: return '';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">My Reports</h2>
        <p className="text-muted-foreground">
          Your personal booking and activity reports
        </p>
      </div>

      <ReportFilters
        filters={filters}
        onFiltersChange={setFilters}
        options={{
          statuses: statusOptions,
          paymentMethods: paymentMethodOptions
        }}
        showPaymentMethodFilter={activeReport === 'payments'}
      />

      <Tabs value={activeReport} onValueChange={setActiveReport}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="bookings">Bookings</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
          <TabsTrigger value="rewards">Rewards</TabsTrigger>
          <TabsTrigger value="status">Status</TabsTrigger>
        </TabsList>

        {['bookings', 'payments', 'rewards', 'status'].map((tab) => (
          <TabsContent key={tab} value={tab}>
            <ReportCard
              title={getReportTitle()}
              description={getReportDescription()}
              data={reportData}
              columns={getColumns()}
              filename={`my-${tab}-${new Date().toISOString().split('T')[0]}`}
              loading={loading}
              onRefresh={loadReportData}
            >
              {reportData.length > 0 && (
                <ResponsiveTable
                  data={reportData.slice(0, 10)}
                  columns={getTableColumns()}
                />
              )}
            </ReportCard>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};