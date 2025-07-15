import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Filter, Calendar } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Tables } from '@/integrations/supabase/types';
import { format } from 'date-fns';

type ActivityLog = Tables<'incharge_activity_logs'> & {
  incharges?: {
    full_name: string;
    email: string;
  };
};

export const InchargeActivityLog = () => {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const { user, userRole } = useAuth();

  const fetchActivityLogs = async () => {
    if (!user) return;

    try {
      setLoading(true);
      let query = supabase
        .from('incharge_activity_logs')
        .select(`
          *,
          incharges:incharge_id (
            full_name,
            email
          )
        `)
        .order('created_at', { ascending: false })
        .limit(100);

      // If merchant, only show logs for their incharges
      if (userRole === 'merchant') {
        const { data: merchantIncharges } = await supabase
          .from('incharges')
          .select('id')
          .eq('merchant_id', user.id);
        
        if (merchantIncharges) {
          const inchargeIds = merchantIncharges.map(i => i.id);
          query = query.in('incharge_id', inchargeIds);
        }
      }

      const { data, error } = await query;

      if (error) throw error;
      setLogs(data || []);
    } catch (error) {
      console.error('Error fetching activity logs:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && (userRole === 'merchant' || userRole === 'admin')) {
      fetchActivityLogs();
    }
  }, [user, userRole]);

  const filteredLogs = logs.filter(log => {
    const searchLower = searchTerm.toLowerCase();
    const inchargeName = log.incharges?.full_name?.toLowerCase() || '';
    const action = log.action.toLowerCase();
    const details = JSON.stringify(log.details || {}).toLowerCase();
    
    return inchargeName.includes(searchLower) || 
           action.includes(searchLower) || 
           details.includes(searchLower);
  });

  const getActionColor = (action: string) => {
    switch (action.toLowerCase()) {
      case 'booking_confirmed':
      case 'booking_checked_in':
        return 'bg-success text-success-foreground';
      case 'booking_cancelled':
      case 'booking_checked_out':
        return 'bg-destructive text-destructive-foreground';
      case 'booking_updated':
        return 'bg-primary text-primary-foreground';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const formatAction = (action: string) => {
    return action.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Incharge Activity Logs</CardTitle>
            <div className="flex items-center space-x-2">
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
          </div>
        </CardHeader>
        <CardContent>
          {filteredLogs.length === 0 ? (
            <div className="text-center py-8">
              <div className="space-y-3">
                <div className="mx-auto w-12 h-12 bg-muted rounded-lg flex items-center justify-center">
                  <Calendar className="h-6 w-6 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-medium">No activity logs found</h3>
                <p className="text-muted-foreground">
                  Incharge activities will appear here when they perform actions.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredLogs.map((log) => (
                <div key={log.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <Badge className={getActionColor(log.action)}>
                          {formatAction(log.action)}
                        </Badge>
                        <span className="text-sm font-medium">
                          {log.incharges?.full_name || 'Unknown Incharge'}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {log.incharges?.email}
                      </p>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(log.created_at), 'MMM dd, yyyy HH:mm')}
                    </span>
                  </div>
                  
                  {log.details && Object.keys(log.details).length > 0 && (
                    <div className="bg-muted rounded p-3">
                      <p className="text-sm font-medium mb-2">Details:</p>
                      <div className="text-xs space-y-1">
                        {Object.entries(log.details).map(([key, value]) => (
                          <div key={key} className="flex">
                            <span className="font-medium capitalize min-w-[100px]">
                              {key.replace(/_/g, ' ')}:
                            </span>
                            <span className="ml-2">{String(value)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};