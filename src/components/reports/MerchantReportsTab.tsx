import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useReports, ReportFilter } from '@/hooks/useReports';
import { ReportCard } from './ReportCard';
import { ReportFilters } from './ReportFilters';
import { formatCurrency, formatDate, formatDateTime } from '@/utils/exportUtils';
import { ResponsiveTable } from '@/components/ResponsiveTable';
import { Badge } from '@/components/ui/badge';

export const MerchantReportsTab: React.FC = () => {
  const { 
    loading,
    fetchBookingsReport,
    fetchTransactionsReport,
    fetchSettlementsReport,
    fetchStudyHallsReport,
    fetchCouponsReport
  } = useReports();

  const [activeReport, setActiveReport] = useState('studyhalls');
  const [filters, setFilters] = useState<ReportFilter>({});
  const [reportData, setReportData] = useState<any[]>([]);

  const loadReportData = async () => {
    switch (activeReport) {
      case 'studyhalls':
        const studyHalls = await fetchStudyHallsReport(filters);
        setReportData(studyHalls);
        break;
      case 'bookings':
        const bookings = await fetchBookingsReport(filters);
        setReportData(bookings);
        break;
      case 'earnings':
        const transactions = await fetchTransactionsReport(filters);
        setReportData(transactions);
        break;
      case 'settlements':
        const settlements = await fetchSettlementsReport(filters);
        setReportData(settlements);
        break;
      case 'coupons':
        const coupons = await fetchCouponsReport(filters);
        setReportData(coupons);
        break;
    }
  };

  useEffect(() => {
    loadReportData();
  }, [activeReport, filters]);

  const getColumns = () => {
    switch (activeReport) {
      case 'studyhalls':
        return [
          { key: 'name', title: 'Study Hall Name' },
          { key: 'location', title: 'Location' },
          { key: 'total_seats', title: 'Total Seats' },
          { key: 'daily_price', title: 'Daily Price', format: formatCurrency },
          { key: 'weekly_price', title: 'Weekly Price', format: formatCurrency },
          { key: 'monthly_price', title: 'Monthly Price', format: formatCurrency },
          { key: 'average_rating', title: 'Rating', format: (value: number) => value ? value.toFixed(1) : 'N/A' },
          { key: 'total_reviews', title: 'Reviews' },
          { key: 'status', title: 'Status' },
          { key: 'created_at', title: 'Created', format: formatDate }
        ];
      case 'bookings':
        return [
          { key: 'booking_number', title: 'Booking ID', format: (value: any) => value ? `B${value}` : 'Pending' },
          { key: 'user.full_name', title: 'Customer' },
          { key: 'user.email', title: 'Email' },
          { key: 'study_hall.name', title: 'Study Hall' },
          { key: 'seat.seat_id', title: 'Seat' },
          { key: 'start_date', title: 'Start Date', format: formatDate },
          { key: 'end_date', title: 'End Date', format: formatDate },
          { key: 'booking_period', title: 'Period' },
          { key: 'total_amount', title: 'Amount', format: formatCurrency },
          { key: 'status', title: 'Status' },
          { key: 'created_at', title: 'Booked On', format: formatDateTime }
        ];
      case 'earnings':
        return [
          { key: 'transaction_number', title: 'Transaction ID', format: (value: any) => value ? `T${value}` : 'Pending' },
          { key: 'booking.booking_number', title: 'Booking ID', format: (value: any) => value ? `B${value}` : 'N/A' },
          { key: 'booking.user.full_name', title: 'Customer' },
          { key: 'amount', title: 'Gross Amount', format: formatCurrency },
          { key: 'net_amount', title: 'Net Earnings', format: (value: any) => formatCurrency(value || 0) },
          { key: 'payment_method', title: 'Payment Method' },
          { key: 'status', title: 'Status' },
          { key: 'created_at', title: 'Date', format: formatDateTime }
        ];
      case 'settlements':
        return [
          { key: 'settlement_number', title: 'Settlement ID', format: (value: any) => `S${value}` },
          { key: 'total_booking_amount', title: 'Gross Amount', format: formatCurrency },
          { key: 'platform_fee_amount', title: 'Platform Fee', format: formatCurrency },
          { key: 'net_settlement_amount', title: 'Net Amount', format: formatCurrency },
          { key: 'status', title: 'Status' },
          { key: 'payment_date', title: 'Payment Date', format: formatDate },
          { key: 'payment_method', title: 'Payment Method' },
          { key: 'payment_reference', title: 'Reference' },
          { key: 'created_at', title: 'Created', format: formatDateTime }
        ];
      case 'coupons':
        return [
          { key: 'coupon.code', title: 'Coupon Code' },
          { key: 'coupon.title', title: 'Title' },
          { key: 'coupon.type', title: 'Type' },
          { key: 'coupon.value', title: 'Value', format: formatCurrency },
          { key: 'discount_amount', title: 'Discount', format: formatCurrency },
          { key: 'user.full_name', title: 'Used By' },
          { key: 'booking.booking_number', title: 'Booking', format: (value: any) => value ? `B${value}` : 'N/A' },
          { key: 'used_at', title: 'Used Date', format: formatDateTime }
        ];
      default:
        return [];
    }
  };

  const getTableColumns = () => {
    switch (activeReport) {
      case 'studyhalls':
        return [
          {
            key: 'name',
            title: 'Study Hall',
            render: (value: string, row: any) => (
              <div>
                <div className="font-medium">{value}</div>
                <div className="text-sm text-muted-foreground">{row.location}</div>
              </div>
            )
          },
          {
            key: 'total_seats',
            title: 'Capacity',
            render: (value: number) => `${value} seats`
          },
          {
            key: 'daily_price',
            title: 'Daily Price',
            render: (value: number) => formatCurrency(value)
          },
          {
            key: 'status',
            title: 'Status',
            render: (value: string) => (
              <Badge variant={value === 'active' ? 'default' : 'secondary'}>
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

  const getReportTitle = () => {
    switch (activeReport) {
      case 'studyhalls': return 'My Study Halls Summary';
      case 'bookings': return 'Bookings Report';
      case 'earnings': return 'Income & Earnings Report';
      case 'settlements': return 'Settlements Report';
      case 'coupons': return 'Coupon Usage Report';
      default: return 'Report';
    }
  };

  const getReportDescription = () => {
    switch (activeReport) {
      case 'studyhalls': return 'Overview of all your study halls and their performance';
      case 'bookings': return 'All bookings made at your study halls';
      case 'earnings': return 'Revenue breakdown and earnings analysis';
      case 'settlements': return 'Settlement history and payment tracking';
      case 'coupons': return 'Coupon usage statistics and discount tracking';
      default: return '';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Merchant Reports</h2>
        <p className="text-muted-foreground">
          Detailed reports for your study halls and business performance
        </p>
      </div>

      <ReportFilters
        filters={filters}
        onFiltersChange={setFilters}
        options={{
          statuses: statusOptions
        }}
      />

      <Tabs value={activeReport} onValueChange={setActiveReport}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="studyhalls">Study Halls</TabsTrigger>
          <TabsTrigger value="bookings">Bookings</TabsTrigger>
          <TabsTrigger value="earnings">Earnings</TabsTrigger>
          <TabsTrigger value="settlements">Settlements</TabsTrigger>
          <TabsTrigger value="coupons">Coupons</TabsTrigger>
        </TabsList>

        {['studyhalls', 'bookings', 'earnings', 'settlements', 'coupons'].map((tab) => (
          <TabsContent key={tab} value={tab}>
            <ReportCard
              title={getReportTitle()}
              description={getReportDescription()}
              data={reportData}
              columns={getColumns()}
              filename={`merchant-${tab}-${new Date().toISOString().split('T')[0]}`}
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