import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RefreshCcw, AlertTriangle, CheckCircle, Clock, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface BookingHealth {
  total_bookings: number;
  pending_unpaid: number;
  expired_active: number;
  orphaned_seats: number;
  confirmed_future: number;
  completed_today: number;
}

interface StuckBooking {
  id: string;
  user_email: string;
  study_hall_name: string;
  seat_id: string;
  status: string;
  payment_status: string;
  created_at: string;
  start_date: string;
  end_date: string;
}

export function BookingHealthMonitor() {
  const [health, setHealth] = useState<BookingHealth | null>(null);
  const [stuckBookings, setStuckBookings] = useState<StuckBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchHealthData = async () => {
    setLoading(true);
    try {
      // Get booking health metrics
      const { data: healthData, error: healthError } = await supabase.rpc('get_booking_health_metrics');
      if (healthError) throw healthError;

      // Get stuck bookings
      const { data: stuckData, error: stuckError } = await supabase
        .from('bookings')
        .select(`
          id,
          status,
          payment_status,
          created_at,
          start_date,
          end_date,
          seat_id,
          profiles!bookings_user_id_fkey(email),
          study_halls(name)
        `)
        .or('and(status.eq.pending,payment_status.eq.unpaid,created_at.lt.2024-01-01),and(status.in.(active,confirmed),payment_status.eq.paid,end_date.lt.2024-01-01)')
        .limit(20);

      if (stuckError) throw stuckError;

      setHealth(healthData?.[0] || {
        total_bookings: 0,
        pending_unpaid: 0,
        expired_active: 0,
        orphaned_seats: 0,
        confirmed_future: 0,
        completed_today: 0,
      });

      setStuckBookings(
        stuckData?.map((booking: any) => ({
          id: booking.id,
          user_email: booking.profiles?.email || 'Unknown',
          study_hall_name: booking.study_halls?.name || 'Unknown',
          seat_id: booking.seat_id,
          status: booking.status,
          payment_status: booking.payment_status,
          created_at: booking.created_at,
          start_date: booking.start_date,
          end_date: booking.end_date,
        })) || []
      );
    } catch (error) {
      console.error('Error fetching booking health:', error);
      toast({
        title: "Error",
        description: "Failed to fetch booking health data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const runManualCleanup = async () => {
    try {
      const { error } = await supabase.rpc('run_booking_lifecycle_checks');
      if (error) throw error;

      toast({
        title: "Success",
        description: "Manual booking cleanup completed",
      });

      // Refresh data
      await fetchHealthData();
    } catch (error) {
      console.error('Error running cleanup:', error);
      toast({
        title: "Error",
        description: "Failed to run manual cleanup",
        variant: "destructive",
      });
    }
  };

  const fixStuckBooking = async (bookingId: string, action: 'cancel' | 'complete') => {
    try {
      const newStatus = action === 'cancel' ? 'cancelled' : 'completed';
      
      const { error } = await supabase
        .from('bookings')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', bookingId);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Booking ${action}ed successfully`,
      });

      await fetchHealthData();
    } catch (error) {
      console.error('Error fixing booking:', error);
      toast({
        title: "Error",
        description: `Failed to ${action} booking`,
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchHealthData();
  }, []);

  if (loading || !health) {
    return <div className="p-6">Loading booking health data...</div>;
  }

  const healthScore = Math.max(0, 100 - (health.pending_unpaid * 2) - (health.expired_active * 5) - (health.orphaned_seats * 3));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Booking Health Monitor</h2>
        <div className="flex gap-2">
          <Button onClick={fetchHealthData} variant="outline" size="sm">
            <RefreshCcw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={runManualCleanup} variant="outline" size="sm">
            <CheckCircle className="h-4 w-4 mr-2" />
            Run Cleanup
          </Button>
        </div>
      </div>

      {/* Health Score */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Overall Health Score
            <Badge variant={healthScore > 80 ? "default" : healthScore > 60 ? "secondary" : "destructive"}>
              {healthScore}%
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{health.total_bookings}</div>
              <div className="text-sm text-muted-foreground">Total Bookings</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{health.confirmed_future}</div>
              <div className="text-sm text-muted-foreground">Confirmed Future</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{health.completed_today}</div>
              <div className="text-sm text-muted-foreground">Completed Today</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">{health.pending_unpaid}</div>
              <div className="text-sm text-muted-foreground">Pending Unpaid</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{health.expired_active}</div>
              <div className="text-sm text-muted-foreground">Expired Active</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{health.orphaned_seats}</div>
              <div className="text-sm text-muted-foreground">Orphaned Seats</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Issues that need attention */}
      {(health.pending_unpaid > 0 || health.expired_active > 0 || health.orphaned_seats > 0) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              Issues Requiring Attention
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {health.pending_unpaid > 0 && (
                <div className="flex items-center gap-2 text-yellow-600">
                  <Clock className="h-4 w-4" />
                  {health.pending_unpaid} bookings pending payment for over 24 hours
                </div>
              )}
              {health.expired_active > 0 && (
                <div className="flex items-center gap-2 text-red-600">
                  <AlertTriangle className="h-4 w-4" />
                  {health.expired_active} active bookings past their end date
                </div>
              )}
              {health.orphaned_seats > 0 && (
                <div className="flex items-center gap-2 text-purple-600">
                  <X className="h-4 w-4" />
                  {health.orphaned_seats} seats marked unavailable without active bookings
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stuck Bookings */}
      {stuckBookings.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Problematic Bookings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stuckBookings.map((booking) => (
                <div key={booking.id} className="border rounded-lg p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">{booking.user_email}</div>
                      <div className="text-sm text-muted-foreground">
                        {booking.study_hall_name} - Seat {booking.seat_id}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Badge variant={booking.status === 'pending' ? 'secondary' : 'destructive'}>
                        {booking.status}
                      </Badge>
                      <Badge variant={booking.payment_status === 'paid' ? 'default' : 'destructive'}>
                        {booking.payment_status}
                      </Badge>
                    </div>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Created: {new Date(booking.created_at).toLocaleDateString()} | 
                    Period: {booking.start_date} to {booking.end_date}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => fixStuckBooking(booking.id, 'cancel')}
                    >
                      Cancel Booking
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => fixStuckBooking(booking.id, 'complete')}
                    >
                      Mark Complete
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {stuckBookings.length === 0 && health.pending_unpaid === 0 && health.expired_active === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
            <div className="text-lg font-medium">All Clear!</div>
            <div className="text-muted-foreground">No booking issues detected</div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}