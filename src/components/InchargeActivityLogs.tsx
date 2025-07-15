import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, Calendar, User, Building, CheckCircle, XCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';

interface ActivityLog {
  id: string;
  action: string;
  details: any;
  created_at: string;
  booking_id?: string;
  study_hall_id?: string;
}

interface InchargeActivityLogsProps {
  inchargeId: string;
}

export function InchargeActivityLogs({ inchargeId }: InchargeActivityLogsProps) {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchActivityLogs = async () => {
      try {
        const { data, error } = await supabase
          .from('incharge_activity_logs')
          .select('*')
          .eq('incharge_id', inchargeId)
          .order('created_at', { ascending: false })
          .limit(100);

        if (error) {
          console.error('Error fetching activity logs:', error);
          return;
        }

        setLogs(data || []);
      } catch (error) {
        console.error('Error fetching activity logs:', error);
      } finally {
        setLoading(false);
      }
    };

    if (inchargeId) {
      fetchActivityLogs();
    }
  }, [inchargeId]);

  const filteredLogs = logs.filter(log => {
    const searchLower = searchTerm.toLowerCase();
    const action = log.action.toLowerCase();
    const details = JSON.stringify(log.details).toLowerCase();
    
    return action.includes(searchLower) || details.includes(searchLower);
  });

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'booking_confirmed':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'booking_cancelled':
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Calendar className="h-4 w-4 text-blue-600" />;
    }
  };

  const getActionBadge = (action: string) => {
    switch (action) {
      case 'booking_confirmed':
        return <Badge className="bg-green-100 text-green-800">Confirmed</Badge>;
      case 'booking_cancelled':
        return <Badge className="bg-red-100 text-red-800">Cancelled</Badge>;
      default:
        return <Badge variant="outline">{action.replace('_', ' ')}</Badge>;
    }
  };

  const formatActionDetails = (action: string, details: any) => {
    switch (action) {
      case 'booking_confirmed':
      case 'booking_cancelled':
        return (
          <div className="text-sm text-muted-foreground">
            <p>Booking #{details.booking_number}</p>
            <p>User: {details.user_email}</p>
            <p>Study Hall: {details.study_hall}</p>
            <p>Seat: {details.seat}</p>
            <p>Amount: ₹{details.amount}</p>
          </div>
        );
      default:
        return (
          <div className="text-sm text-muted-foreground">
            {JSON.stringify(details, null, 2)}
          </div>
        );
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Activity Logs</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="h-16 bg-muted rounded-lg"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Activity Logs</CardTitle>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search activities..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-64"
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {filteredLogs.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No activity logs found</p>
            </div>
          ) : (
            filteredLogs.map((log) => (
              <div key={log.id} className="border rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3">
                    {getActionIcon(log.action)}
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        {getActionBadge(log.action)}
                        <span className="text-sm text-muted-foreground">
                          {format(new Date(log.created_at), 'MMM dd, yyyy HH:mm')}
                        </span>
                      </div>
                      {formatActionDetails(log.action, log.details)}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}