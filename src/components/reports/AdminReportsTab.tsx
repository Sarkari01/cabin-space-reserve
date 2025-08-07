import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useReports, ReportFilter } from '@/hooks/useReports';
import { ReportCard } from './ReportCard';
import { ReportFilters } from './ReportFilters';
import { formatCurrency, formatDate, formatDateTime } from '@/utils/exportUtils';
import { ResponsiveTable } from '@/components/ResponsiveTable';
import { Badge } from '@/components/ui/badge';

export const AdminReportsTab: React.FC = () => {
  const { 
    loading,
    fetchBookingsReport,
    fetchTransactionsReport, 
    fetchSettlementsReport,
    fetchStudyHallsReport,
    fetchSubscriptionsReport
  } = useReports();

  const [activeReport, setActiveReport] = useState('bookings');
  const [filters, setFilters] = useState<ReportFilter>({});
  const [reportData, setReportData] = useState<any[]>([]);

  const loadReportData = async () => {
    switch (activeReport) {
      case 'bookings':
        const bookings = await fetchBookingsReport(filters);
        setReportData(bookings);
        break;
      case 'transactions':
        const transactions = await fetchTransactionsReport(filters);
        setReportData(transactions);
        break;
      case 'settlements':
        const settlements = await fetchSettlementsReport(filters);
        setReportData(settlements);
        break;
      case 'studyhalls':
        const studyHalls = await fetchStudyHallsReport(filters);
        setReportData(studyHalls);
        break;
      case 'subscriptions':
        const subscriptions = await fetchSubscriptionsReport(filters);
        setReportData(subscriptions);
        break;
    }
  };

  useEffect(() => {
    loadReportData();
  }, [activeReport, filters]);

  const getColumns = () => {
    switch (activeReport) {
      case 'bookings':
        return [
          { key: 'booking_number', title: 'Booking ID', format: (value: any) => value ? `B${value}` : 'Pending' },
          { key: 'user.full_name', title: 'Customer', format: (value: any) => value || 'N/A' },
          { key: 'user.email', title: 'Email' },
          { key: 'study_hall.name', title: 'Study Hall' },
          { key: 'study_hall.location', title: 'Location' },
          { key: 'start_date', title: 'Start Date', format: formatDate },
          { key: 'end_date', title: 'End Date', format: formatDate },
          { key: 'total_amount', title: 'Amount', format: formatCurrency },
          { key: 'status', title: 'Status' },
          { key: 'payment_status', title: 'Payment' },
          { key: 'created_at', title: 'Created', format: formatDateTime }
        ];
      case 'transactions':
        return [
          { key: 'transaction_number', title: 'Transaction ID', format: (value: any) => value ? `T${value}` : 'Pending' },
           { key: 'booking.booking_number', title: 'Booking ID', format: (value: any) => value ? `B${value}` : 'N/A' },
           { key: 'booking.user.full_name', title: 'Customer' },
           { key: 'amount', title: 'Total Amount', format: formatCurrency },
           { key: 'booking_amount', title: 'Booking Amount', format: (value: any) => formatCurrency(value || 0) },
           { key: 'deposit_amount', title: 'Deposit Amount', format: (value: any) => formatCurrency(value || 0) },
           { key: 'payment_method', title: 'Payment Method' },
           { key: 'status', title: 'Status' },
           { key: 'created_at', title: 'Date', format: formatDateTime }
        ];
      case 'settlements':
        return [
          { key: 'settlement_number', title: 'Settlement ID', format: (value: any) => `S${value}` },
          { key: 'merchant.full_name', title: 'Merchant' },
          { key: 'merchant.email', title: 'Email' },
          { key: 'total_booking_amount', title: 'Gross Amount', format: formatCurrency },
          { key: 'platform_fee_amount', title: 'Platform Fee', format: formatCurrency },
          { key: 'net_settlement_amount', title: 'Net Amount', format: formatCurrency },
          { key: 'status', title: 'Status' },
          { key: 'payment_date', title: 'Payment Date', format: formatDate },
          { key: 'created_at', title: 'Created', format: formatDateTime }
        ];
      case 'studyhalls':
        return [
          { key: 'name', title: 'Study Hall Name' },
          { key: 'merchant.full_name', title: 'Owner' },
          { key: 'location', title: 'Location' },
          { key: 'total_seats', title: 'Capacity' },
          { key: 'daily_price', title: 'Daily Price', format: formatCurrency },
          { key: 'monthly_price', title: 'Monthly Price', format: formatCurrency },
          { key: 'status', title: 'Status' },
          { key: 'created_at', title: 'Created', format: formatDate }
        ];
      case 'subscriptions':
        return [
          { key: 'merchant.full_name', title: 'Merchant' },
          { key: 'merchant.email', title: 'Email' },
          { key: 'plan.name', title: 'Plan Name' },
          { key: 'plan.price', title: 'Plan Price', format: formatCurrency },
          { key: 'status', title: 'Status' },
          { key: 'start_date', title: 'Start Date', format: formatDate },
          { key: 'end_date', title: 'End Date', format: formatDate },
          { key: 'is_trial', title: 'Trial', format: (value: boolean) => value ? 'Yes' : 'No' }
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
            render: (value: any, row: any) => (
              <span className="font-mono text-sm">
                {value ? `B${value}` : 'Pending'}
              </span>
            )
          },
          {
            key: 'user',
            title: 'Customer',
            render: (value: any) => (
              <div>
                <div className="font-medium">{value?.full_name || 'N/A'}</div>
                <div className="text-sm text-muted-foreground">{value?.email || 'N/A'}</div>
              </div>
            )
          },
          {
            key: 'study_hall',
            title: 'Study Hall',
            render: (value: any) => (
              <div>
                <div className="font-medium">{value?.name || 'N/A'}</div>
                <div className="text-sm text-muted-foreground">{value?.location || 'N/A'}</div>
              </div>
            )
          },
          {
            key: 'total_amount',
            title: 'Amount',
            render: (value: number) => formatCurrency(value || 0)
          },
          {
            key: 'status',
            title: 'Status',
            render: (value: string) => (
              <Badge variant={value === 'completed' ? 'default' : value === 'cancelled' ? 'destructive' : 'secondary'}>
                {value}
              </Badge>
            )
          }
        ];
      case 'transactions':
        return [
          {
            key: 'transaction_number',
            title: 'Transaction ID',
            render: (value: any) => (
              <span className="font-mono text-sm">
                {value ? `T${value}` : 'Pending'}
              </span>
            )
          },
          {
            key: 'booking',
            title: 'Booking',
            render: (value: any) => (
              <div>
                <div className="font-medium">
                  {value?.booking_number ? `B${value.booking_number}` : 'N/A'}
                </div>
                <div className="text-sm text-muted-foreground">
                  {value?.user?.full_name || 'N/A'}
                </div>
              </div>
            )
          },
           {
             key: 'amount',
             title: 'Total Amount',
             render: (value: number, row: any) => (
               <div>
                 <div className="font-medium">{formatCurrency(value || 0)}</div>
                 {row.booking_amount && row.deposit_amount && Number(row.deposit_amount) > 0 && (
                   <div className="text-xs text-muted-foreground">
                     Booking: {formatCurrency(row.booking_amount)} + Deposit: {formatCurrency(row.deposit_amount)}
                   </div>
                 )}
               </div>
             )
           },
          {
            key: 'payment_method',
            title: 'Payment Method',
            render: (value: string) => (
              <Badge variant="outline">
                {value?.toUpperCase() || 'N/A'}
              </Badge>
            )
          },
          {
            key: 'status',
            title: 'Status',
            render: (value: string) => (
              <Badge variant={value === 'completed' ? 'default' : value === 'failed' ? 'destructive' : 'secondary'}>
                {value}
              </Badge>
            )
          }
        ];
      case 'settlements':
        return [
          {
            key: 'settlement_number',
            title: 'Settlement ID',
            render: (value: any) => (
              <span className="font-mono text-sm">
                {value ? `S${value}` : 'N/A'}
              </span>
            )
          },
          {
            key: 'merchant',
            title: 'Merchant',
            render: (value: any) => (
              <div>
                <div className="font-medium">{value?.full_name || 'N/A'}</div>
                <div className="text-sm text-muted-foreground">{value?.email || 'N/A'}</div>
              </div>
            )
          },
          {
            key: 'total_booking_amount',
            title: 'Gross Amount',
            render: (value: number) => formatCurrency(value || 0)
          },
          {
            key: 'net_settlement_amount',
            title: 'Net Amount',
            render: (value: number) => formatCurrency(value || 0)
          },
          {
            key: 'status',
            title: 'Status',
            render: (value: string) => (
              <Badge variant={value === 'paid' ? 'default' : value === 'rejected' ? 'destructive' : 'secondary'}>
                {value}
              </Badge>
            )
          }
        ];
      case 'studyhalls':
        return [
          {
            key: 'name',
            title: 'Study Hall',
            render: (value: string, row: any) => (
              <div>
                <div className="font-medium">{value || 'N/A'}</div>
                <div className="text-sm text-muted-foreground">{row?.location || 'N/A'}</div>
              </div>
            )
          },
          {
            key: 'merchant',
            title: 'Owner',
            render: (value: any) => (
              <div>
                <div className="font-medium">{value?.full_name || 'N/A'}</div>
                <div className="text-sm text-muted-foreground">{value?.email || 'N/A'}</div>
              </div>
            )
          },
          {
            key: 'total_seats',
            title: 'Capacity',
            render: (value: number) => (
              <span className="font-medium">{value || 0} seats</span>
            )
          },
          {
            key: 'daily_price',
            title: 'Daily Price',
            render: (value: number) => formatCurrency(value || 0)
          },
          {
            key: 'status',
            title: 'Status',
            render: (value: string) => (
              <Badge variant={value === 'active' ? 'default' : value === 'inactive' ? 'destructive' : 'secondary'}>
                {value}
              </Badge>
            )
          }
        ];
      case 'subscriptions':
        return [
          {
            key: 'merchant',
            title: 'Merchant',
            render: (value: any) => (
              <div>
                <div className="font-medium">{value?.full_name || 'N/A'}</div>
                <div className="text-sm text-muted-foreground">{value?.email || 'N/A'}</div>
              </div>
            )
          },
          {
            key: 'plan',
            title: 'Plan',
            render: (value: any, row: any) => (
              <div>
                <div className="font-medium">{value?.name || 'N/A'}</div>
                <div className="text-sm text-muted-foreground">
                  {formatCurrency(value?.price || 0)}
                </div>
              </div>
            )
          },
          {
            key: 'is_trial',
            title: 'Trial',
            render: (value: boolean) => (
              <Badge variant={value ? 'secondary' : 'outline'}>
                {value ? 'Trial' : 'Paid'}
              </Badge>
            )
          },
          {
            key: 'status',
            title: 'Status',
            render: (value: string) => (
              <Badge variant={value === 'active' ? 'default' : value === 'expired' ? 'destructive' : 'secondary'}>
                {value}
              </Badge>
            )
          }
        ];
      default:
        return [];
    }
  };

  const statusOptions = [
    { value: 'confirmed', label: 'Confirmed' },
    { value: 'pending', label: 'Pending' },
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
      case 'bookings': return 'All Bookings Report';
      case 'transactions': return 'Transactions Report';
      case 'settlements': return 'Settlements Report';
      case 'studyhalls': return 'Study Halls Overview';
      case 'subscriptions': return 'Subscriptions Report';
      default: return 'Report';
    }
  };

  const getReportDescription = () => {
    switch (activeReport) {
      case 'bookings': return 'Complete booking history across all merchants and users';
      case 'transactions': return 'Payment transactions and processing status';
      case 'settlements': return 'Merchant settlements and commission tracking';
      case 'studyhalls': return 'Study hall overview and performance metrics';
      case 'subscriptions': return 'Merchant subscription plans and status';
      default: return '';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Admin Reports</h2>
        <p className="text-muted-foreground">
          Comprehensive reports and analytics for platform management
        </p>
      </div>

      <ReportFilters
        filters={filters}
        onFiltersChange={setFilters}
        options={{
          statuses: statusOptions,
          paymentMethods: paymentMethodOptions
        }}
        showPaymentMethodFilter={activeReport === 'transactions'}
      />

      <Tabs value={activeReport} onValueChange={setActiveReport}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="bookings">Bookings</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="settlements">Settlements</TabsTrigger>
          <TabsTrigger value="studyhalls">Study Halls</TabsTrigger>
          <TabsTrigger value="subscriptions">Subscriptions</TabsTrigger>
        </TabsList>

        {['bookings', 'transactions', 'settlements', 'studyhalls', 'subscriptions'].map((tab) => (
          <TabsContent key={tab} value={tab}>
            <ReportCard
              title={getReportTitle()}
              description={getReportDescription()}
              data={reportData}
              columns={getColumns()}
              filename={`admin-${tab}-${new Date().toISOString().split('T')[0]}`}
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