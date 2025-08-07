import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Search, CheckCircle, Circle, DollarSign, Calendar, User } from 'lucide-react';
import { format } from 'date-fns';

interface CabinBookingWithDeposit {
  id: string;
  booking_number: number;
  user_id: string;
  cabin_id: string;
  private_hall_id: string;
  start_date: string;
  end_date: string;
  deposit_amount: number;
  total_amount: number;
  deposit_refunded: boolean;
  status: string;
  guest_name?: string;
  guest_phone?: string;
  created_at: string;
  // Joined data
  cabin_name: string;
  private_hall_name: string;
  user_email?: string;
}

export const AdminDepositRefundsTab: React.FC = () => {
  const [bookings, setBookings] = useState<CabinBookingWithDeposit[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<'all' | 'pending' | 'refunded'>('all');
  const { toast } = useToast();

  const fetchBookingsWithDeposits = async () => {
    try {
      setLoading(true);

      // Fetch cabin bookings with deposit amounts
      const { data: cabinBookings, error } = await supabase
        .from('cabin_bookings')
        .select(`
          id,
          booking_number,
          user_id,
          cabin_id,
          private_hall_id,
          start_date,
          end_date,
          deposit_amount,
          total_amount,
          deposit_refunded,
          status,
          guest_name,
          guest_phone,
          created_at
        `)
        .gt('deposit_amount', 0)
        .eq('status', 'completed')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching bookings:', error);
        toast({
          title: "Error",
          description: "Failed to load deposit refund data",
          variant: "destructive",
        });
        return;
      }

      // Get user emails for non-guest bookings
      const userIds = cabinBookings
        ?.filter(booking => booking.user_id)
        .map(booking => booking.user_id) || [];

      let userEmails: { [key: string]: string } = {};
      if (userIds.length > 0) {
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('id, email')
          .in('id', userIds);

        if (!profilesError && profiles) {
          userEmails = profiles.reduce((acc, profile) => {
            acc[profile.id] = profile.email;
            return acc;
          }, {} as { [key: string]: string });
        }
      }

      // Get cabin and hall names separately
      const cabinIds = cabinBookings?.map(b => b.cabin_id) || [];
      const hallIds = cabinBookings?.map(b => b.private_hall_id) || [];

      let cabinNames: { [key: string]: string } = {};
      let hallNames: { [key: string]: string } = {};

      if (cabinIds.length > 0) {
        const { data: cabins } = await supabase
          .from('cabins')
          .select('id, cabin_name')
          .in('id', cabinIds);
        
        if (cabins) {
          cabinNames = cabins.reduce((acc, cabin) => {
            acc[cabin.id] = cabin.cabin_name;
            return acc;
          }, {} as { [key: string]: string });
        }
      }

      if (hallIds.length > 0) {
        const { data: halls } = await supabase
          .from('private_halls')
          .select('id, name')
          .in('id', hallIds);
        
        if (halls) {
          hallNames = halls.reduce((acc, hall) => {
            acc[hall.id] = hall.name;
            return acc;
          }, {} as { [key: string]: string });
        }
      }

      // Transform the data
      const transformedBookings: CabinBookingWithDeposit[] = cabinBookings?.map(booking => ({
        ...booking,
        cabin_name: cabinNames[booking.cabin_id] || 'Unknown Cabin',
        private_hall_name: hallNames[booking.private_hall_id] || 'Unknown Hall',
        user_email: booking.user_id ? userEmails[booking.user_id] : undefined,
      })) || [];

      setBookings(transformedBookings);
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: "Failed to load deposit refund data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookingsWithDeposits();
  }, []);

  const handleMarkAsRefunded = async (bookingId: string) => {
    try {
      const { error } = await supabase
        .from('cabin_bookings')
        .update({ deposit_refunded: true })
        .eq('id', bookingId);

      if (error) {
        console.error('Error updating deposit refund status:', error);
        toast({
          title: "Error",
          description: "Failed to mark deposit as refunded",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Success",
        description: "Deposit marked as refunded",
      });

      // Refresh the data
      fetchBookingsWithDeposits();
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: "Failed to update deposit status",
        variant: "destructive",
      });
    }
  };

  const filteredBookings = bookings.filter(booking => {
    const matchesSearch = searchTerm === '' || 
      booking.booking_number.toString().includes(searchTerm) ||
      booking.cabin_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.private_hall_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.user_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.guest_name?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesFilter = filter === 'all' || 
      (filter === 'pending' && !booking.deposit_refunded) ||
      (filter === 'refunded' && booking.deposit_refunded);

    return matchesSearch && matchesFilter;
  });

  const totalDeposits = bookings.reduce((sum, booking) => sum + booking.deposit_amount, 0);
  const refundedDeposits = bookings
    .filter(booking => booking.deposit_refunded)
    .reduce((sum, booking) => sum + booking.deposit_amount, 0);
  const pendingDeposits = totalDeposits - refundedDeposits;

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
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
      <div>
        <h2 className="text-2xl font-bold">Deposit Refunds Management</h2>
        <p className="text-muted-foreground">Track and manage refundable deposits for cabin bookings</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm text-muted-foreground">Total Deposits</p>
                <p className="text-2xl font-bold">₹{totalDeposits.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <Circle className="h-5 w-5 text-orange-600" />
              <div>
                <p className="text-sm text-muted-foreground">Pending Refunds</p>
                <p className="text-2xl font-bold text-orange-600">₹{pendingDeposits.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm text-muted-foreground">Refunded</p>
                <p className="text-2xl font-bold text-green-600">₹{refundedDeposits.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-4 items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search by booking number, cabin, hall, or customer..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          <Button 
            variant={filter === 'all' ? 'default' : 'outline'} 
            onClick={() => setFilter('all')}
            size="sm"
          >
            All
          </Button>
          <Button 
            variant={filter === 'pending' ? 'default' : 'outline'} 
            onClick={() => setFilter('pending')}
            size="sm"
          >
            Pending
          </Button>
          <Button 
            variant={filter === 'refunded' ? 'default' : 'outline'} 
            onClick={() => setFilter('refunded')}
            size="sm"
          >
            Refunded
          </Button>
        </div>
      </div>

      {/* Bookings List */}
      <div className="space-y-4">
        {filteredBookings.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <p className="text-muted-foreground">No bookings with deposits found</p>
            </CardContent>
          </Card>
        ) : (
          filteredBookings.map(booking => (
            <Card key={booking.id}>
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">#{booking.booking_number}</Badge>
                      <Badge variant={booking.deposit_refunded ? 'default' : 'secondary'}>
                        {booking.deposit_refunded ? 'Refunded' : 'Pending'}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="font-medium">{booking.private_hall_name}</p>
                        <p className="text-muted-foreground">Cabin: {booking.cabin_name}</p>
                      </div>
                      
                      <div>
                        <div className="flex items-center gap-1">
                          <User className="h-4 w-4" />
                          <span>{booking.user_email || booking.guest_name || 'Unknown Customer'}</span>
                        </div>
                        {booking.guest_phone && (
                          <p className="text-muted-foreground">{booking.guest_phone}</p>
                        )}
                      </div>
                      
                      <div>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          <span>{format(new Date(booking.start_date), 'MMM dd')} - {format(new Date(booking.end_date), 'MMM dd, yyyy')}</span>
                        </div>
                        <p className="text-muted-foreground">Completed: {format(new Date(booking.created_at), 'MMM dd, yyyy')}</p>
                      </div>
                      
                      <div>
                        <div className="flex items-center gap-1">
                          <DollarSign className="h-4 w-4" />
                          <span>Deposit: ₹{booking.deposit_amount.toLocaleString()}</span>
                        </div>
                        <p className="text-muted-foreground">Total: ₹{booking.total_amount.toLocaleString()}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    {!booking.deposit_refunded && (
                      <Button
                        onClick={() => handleMarkAsRefunded(booking.id)}
                        size="sm"
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Mark as Refunded
                      </Button>
                    )}
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