import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useTelemarketingBookings } from '@/hooks/useTelemarketingBookings';
import { useAdminData } from '@/hooks/useAdminData';
import { PageHeader } from '@/components/PageHeader';
import { ResponsiveTable } from '@/components/ResponsiveTable';
import { Calendar, User, Building, Search, Eye, CreditCard, Clock } from 'lucide-react';
import { UnifiedBookingDetailModal } from '@/components/UnifiedBookingDetailModal';
import { supabase } from '@/integrations/supabase/client';

export const TelemarketingBookingsTab = () => {
  const { bookings, loading, fetchTelemarketingBookings } = useTelemarketingBookings();
  const { users, studyHalls } = useAdminData();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedBooking, setSelectedBooking] = useState<any>(null);
  const [bookingDetailOpen, setBookingDetailOpen] = useState(false);

  const filteredBookings = bookings.filter(booking => {
    const user = booking.user || users.find(u => u.id === booking.user_id);
    
    const matchesSearch = 
      user?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.guest_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.location_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.id.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || booking.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getUserName = (userId: string) => {
    const user = users.find(u => u.id === userId);
    return user?.full_name || 'Unknown User';
  };

  const getStudyHallName = (studyHallId: string) => {
    const studyHall = studyHalls.find(h => h.id === studyHallId);
    return studyHall?.name || 'Unknown Study Hall';
  };

  const handleViewBooking = (booking: any) => {
    setSelectedBooking(booking);
    setBookingDetailOpen(true);
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      confirmed: 'default',
      active: 'default',
      pending: 'secondary',
      cancelled: 'destructive',
      completed: 'outline'
    };
    return variants[status] || 'outline';
  };

  const getPaymentStatusBadge = (paymentStatus: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      paid: 'default',
      unpaid: 'destructive',
      refunded: 'outline',
      pending: 'secondary'
    };
    return variants[paymentStatus] || 'outline';
  };

  const bookingColumns = [
    {
      title: 'Booking Details',
      key: 'booking_details',
      render: (_: any, booking: any) => (
        <div className="space-y-1">
          <div className="font-medium">#{booking?.booking_number || booking?.id?.slice(0, 8)}</div>
          <div className="text-sm text-muted-foreground flex items-center">
            <User className="h-3 w-3 mr-1" />
            {booking?.user?.full_name || booking?.guest_name || 'Unknown User'}
          </div>
        </div>
      )
    },
    {
      title: 'Location',
      key: 'location',
      render: (_: any, booking: any) => (
        <div className="flex items-center text-sm">
          <Building className="h-3 w-3 mr-1" />
          {booking?.location_name || 'Unknown Location'}
        </div>
      )
    },
    {
      title: 'Period',
      key: 'period',
      render: (_: any, booking: any) => (
        <div className="space-y-1 text-sm">
          <div>{booking?.start_date ? new Date(booking.start_date).toLocaleDateString() : 'N/A'}</div>
          <div className="text-xs text-muted-foreground">
            to {booking?.end_date ? new Date(booking.end_date).toLocaleDateString() : 'N/A'}
          </div>
        </div>
      )
    },
    {
      title: 'Amount',
      key: 'amount',
      render: (_: any, booking: any) => (
        <div className="text-sm font-medium">
          ₹{booking?.total_amount || 0}
        </div>
      )
    },
    {
      title: 'Status',
      key: 'status',
      render: (_: any, booking: any) => (
        <div className="space-y-1">
          <Badge variant={getStatusBadge(booking?.status || '')}>
            {booking?.status || 'Unknown'}
          </Badge>
          <Badge variant={getPaymentStatusBadge(booking?.payment_status || '')} className="text-xs">
            {booking?.payment_status || 'Unknown'}
          </Badge>
        </div>
      )
    },
    {
      title: 'Created',
      key: 'created_at',
      render: (_: any, booking: any) => (
        <div className="flex items-center text-sm">
          <Calendar className="h-3 w-3 mr-1" />
          {booking?.created_at ? new Date(booking.created_at).toLocaleDateString() : 'N/A'}
        </div>
      )
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, booking: any) => (
        <Button
          size="sm"
          variant="outline"
          onClick={() => handleViewBooking(booking)}
          disabled={!booking}
        >
          <Eye className="h-4 w-4 mr-1" />
          View Details
        </Button>
      )
    }
  ];

  const stats = [
    {
      title: "Total Bookings",
      value: bookings.length,
      icon: Calendar,
    },
    {
      title: "Active Bookings",
      value: bookings.filter(b => b.status === 'active').length,
      icon: Calendar,
    },
    {
      title: "Pending Payment",
      value: bookings.filter(b => b.payment_status === 'unpaid').length,
      icon: CreditCard,
    },
    {
      title: "This Month",
      value: bookings.filter(b => {
        const monthAgo = new Date();
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        return new Date(b.created_at) > monthAgo;
      }).length,
      icon: Clock,
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Bookings Management"
        description="Monitor and manage all bookings"
        breadcrumbs={[
          { label: "Dashboard", href: "#", onClick: () => {} },
          { label: "Bookings", active: true }
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
            <CardTitle>All Bookings</CardTitle>
            <div className="flex items-center space-x-2">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search bookings..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 w-[250px]"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="confirmed">Confirmed</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ResponsiveTable
            data={filteredBookings}
            columns={bookingColumns}
            loading={loading}
            emptyMessage="No bookings found"
          />
        </CardContent>
      </Card>

      {/* Booking Detail Modal */}
      {selectedBooking && (
      <UnifiedBookingDetailModal
        booking={selectedBooking}
        open={bookingDetailOpen}
        onOpenChange={setBookingDetailOpen}
        userRole="telemarketing_executive"
      />
      )}
    </div>
  );
};