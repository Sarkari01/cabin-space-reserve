import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Calendar, 
  MapPin, 
  Users, 
  CreditCard, 
  Search,
  CheckCircle,
  XCircle,
  Eye
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useBookings } from '@/hooks/useBookings';
import { useTransactions } from '@/hooks/useTransactions';
import { supabase } from '@/integrations/supabase/client';
import { Tables } from '@/integrations/supabase/types';
import { BookingDetailModal } from '@/components/BookingDetailModal';
import { DashboardSidebar } from '@/components/DashboardSidebar';
import { InchargeActivityLogs } from '@/components/InchargeActivityLogs';
import { InchargeProfile } from '@/components/InchargeProfile';
import { format } from 'date-fns';
import { toast } from '@/hooks/use-toast';

type Incharge = Tables<'incharges'>;

const InchargeDashboard = () => {
  const { user, userProfile } = useAuth();
  const [inchargeData, setInchargeData] = useState<Incharge | null>(null);
  const [assignedStudyHalls, setAssignedStudyHalls] = useState<any[]>([]);
  const [selectedBooking, setSelectedBooking] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  // Use existing hooks but with incharge role
  const { bookings, updateBookingStatus } = useBookings('incharge');
  const { transactions } = useTransactions('incharge');

  useEffect(() => {
    const fetchInchargeData = async () => {
      if (!user || !userProfile?.email) return;

      try {
        // Fetch incharge record
        const { data: incharge, error: inchargeError } = await supabase
          .from('incharges')
          .select('*')
          .eq('email', userProfile.email)
          .eq('status', 'active')
          .single();

        if (inchargeError || !incharge) {
          console.error('Error fetching incharge data:', inchargeError);
          return;
        }

        setInchargeData(incharge);

        // Fetch assigned study halls
        const hallsArray = Array.isArray(incharge.assigned_study_halls) ? incharge.assigned_study_halls : [];
        if (hallsArray.length > 0) {
          const { data: studyHalls, error: hallsError } = await supabase
            .from('study_halls')
            .select('*')
            .in('id', hallsArray as string[]);

          if (!hallsError) {
            setAssignedStudyHalls(studyHalls || []);
          }
        }
      } catch (error) {
        console.error('Error fetching incharge data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchInchargeData();
  }, [user, userProfile]);

  const logActivity = async (action: string, details: any, bookingId?: string, studyHallId?: string) => {
    if (!inchargeData) return;

    try {
      await supabase.from('incharge_activity_logs').insert({
        incharge_id: inchargeData.id,
        action,
        details,
        booking_id: bookingId,
        study_hall_id: studyHallId
      });
    } catch (error) {
      console.error('Error logging activity:', error);
    }
  };

  const handleBookingAction = async (bookingId: string, action: 'confirmed' | 'cancelled', booking: any) => {
    try {
      const success = await updateBookingStatus(bookingId, action);
      
      if (success) {
        await logActivity(
          `booking_${action}`,
          {
            booking_number: booking.booking_number,
            user_email: booking.user?.email,
            study_hall: booking.study_hall?.name,
            seat: booking.seat?.seat_id,
            amount: booking.total_amount
          },
          bookingId,
          booking.study_hall_id
        );

        toast({
          title: "Success",
          description: `Booking ${action} successfully`,
        });
      }
    } catch (error) {
      console.error(`Error ${action} booking:`, error);
    }
  };

  const filteredBookings = bookings.filter(booking => {
    const searchLower = searchTerm.toLowerCase();
    const bookingNumber = booking.booking_number?.toString() || '';
    const userEmail = booking.user?.email?.toLowerCase() || '';
    const studyHallName = booking.study_hall?.name?.toLowerCase() || '';
    
    return bookingNumber.includes(searchLower) ||
           userEmail.includes(searchLower) ||
           studyHallName.includes(searchLower);
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
      case 'active':
        return 'bg-success text-success-foreground';
      case 'pending':
        return 'bg-warning text-warning-foreground';
      case 'cancelled':
        return 'bg-destructive text-destructive-foreground';
      case 'completed':
        return 'bg-muted text-muted-foreground';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!inchargeData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
          <p className="text-muted-foreground">You don't have incharge access or your account is inactive.</p>
        </div>
      </div>
    );
  }

  const todayBookings = bookings.filter(b => {
    const today = new Date().toDateString();
    return new Date(b.start_date).toDateString() === today;
  });

  const pendingBookings = bookings.filter(b => b.status === 'pending');
  const totalRevenue = transactions
    .filter(t => t.status === 'completed')
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <div className="space-y-6">
            {/* Welcome Section */}
            <div className="space-y-2">
              <h2 className="text-2xl font-bold">Welcome back, {inchargeData.full_name}!</h2>
              <p className="text-muted-foreground">
                Manage your assigned study halls and bookings from this dashboard.
              </p>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Today's Bookings</CardTitle>
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{todayBookings.length}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Pending Bookings</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{pendingBookings.length}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{bookings.length}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Revenue</CardTitle>
                  <CreditCard className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">₹{totalRevenue.toFixed(2)}</div>
                </CardContent>
              </Card>
            </div>
          </div>
        );

      case 'studyhalls':
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <MapPin className="h-5 w-5 mr-2" />
                Assigned Study Halls
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {assignedStudyHalls.map((hall) => (
                  <div key={hall.id} className="border rounded-lg p-3">
                    <h3 className="font-medium">{hall.name}</h3>
                    <p className="text-sm text-muted-foreground">{hall.location}</p>
                    <div className="flex justify-between items-center mt-2 text-xs">
                      <span>Monthly: ₹{hall.monthly_price}</span>
                      <Badge variant="outline">{hall.status}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        );

      case 'bookings':
        return (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Bookings Management</CardTitle>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search bookings..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 w-64"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredBookings.map((booking) => (
                  <div key={booking.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <span className="font-medium">#{booking.booking_number}</span>
                          <Badge className={getStatusColor(booking.status)}>
                            {booking.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {booking.user?.email} • {booking.study_hall?.name}
                        </p>
                        <p className="text-sm">
                          {format(new Date(booking.start_date), 'MMM dd, yyyy')} - 
                          {format(new Date(booking.end_date), 'MMM dd, yyyy')}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="font-bold">₹{booking.total_amount}</span>
                        <div className="flex space-x-1">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setSelectedBooking(booking)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {booking.status === 'pending' && (inchargeData.permissions as any)?.manage_bookings && (
                            <>
                              <Button
                                size="sm"
                                onClick={() => handleBookingAction(booking.id, 'confirmed', booking)}
                              >
                                <CheckCircle className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleBookingAction(booking.id, 'cancelled', booking)}
                              >
                                <XCircle className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        );

      case 'transactions':
        return (
          <Card>
            <CardHeader>
              <CardTitle>Transaction History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {transactions.map((transaction) => (
                  <div key={transaction.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <span className="font-medium">#{transaction.transaction_number}</span>
                          <Badge className={getStatusColor(transaction.status)}>
                            {transaction.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {transaction.payment_method?.toUpperCase()} • 
                          {format(new Date(transaction.created_at), 'MMM dd, yyyy HH:mm')}
                        </p>
                      </div>
                      <span className="font-bold">₹{transaction.amount}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        );

      case 'activity':
        return <InchargeActivityLogs inchargeId={inchargeData.id} />;

      case 'profile':
        return <InchargeProfile inchargeData={inchargeData} assignedStudyHalls={assignedStudyHalls} />;

      default:
        return <div>Tab content not found</div>;
    }
  };

  return (
    <DashboardSidebar
      userRole="incharge"
      userName={inchargeData.full_name}
      onTabChange={setActiveTab}
      activeTab={activeTab}
    >
      {renderTabContent()}

      {/* Booking Detail Modal */}
      {selectedBooking && (
        <BookingDetailModal
          booking={selectedBooking}
          open={!!selectedBooking}
          onOpenChange={() => setSelectedBooking(null)}
          userRole="incharge"
        />
      )}
    </DashboardSidebar>
  );
};

export default InchargeDashboard;