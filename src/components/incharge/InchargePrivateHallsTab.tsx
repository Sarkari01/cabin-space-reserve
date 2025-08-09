import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import type { PrivateHall } from '@/types/PrivateHall';
import { ActiveCabinBookingsList } from '@/components/ActiveCabinBookingsList';

const InchargePrivateHallsTab = () => {
  const { userProfile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [privateHalls, setPrivateHalls] = useState<PrivateHall[]>([]);

  useEffect(() => {
    const load = async () => {
      if (!userProfile?.email) return;
      try {
        setLoading(true);
        const { data: incharge, error: inErr } = await supabase
          .from('incharges')
          .select('*')
          .eq('email', userProfile.email)
          .eq('status', 'active')
          .maybeSingle();

        if (inErr || !incharge) return;
        const ids: string[] = Array.isArray((incharge as any).assigned_private_halls)
          ? (incharge as any).assigned_private_halls
          : [];
        if (!ids.length) {
          setPrivateHalls([]);
          return;
        }
        const { data: halls, error: phErr } = await supabase
          .from('private_halls')
          .select('*')
          .in('id', ids);
        if (!phErr) setPrivateHalls((halls || []) as PrivateHall[]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [userProfile?.email]);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-6 w-40 bg-muted animate-pulse rounded" />
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <div className="h-24 bg-muted animate-pulse" />
              <CardContent className="p-4">
                <div className="h-4 bg-muted rounded w-1/2 animate-pulse" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Assigned Private Halls</CardTitle>
        </CardHeader>
        <CardContent>
          {privateHalls.length === 0 ? (
            <p className="text-muted-foreground">No private halls assigned.</p>
          ) : (
            <div className="space-y-6">
              {privateHalls.map((hall) => (
                <div key={hall.id} className="border rounded-lg">
                  <div className="flex items-center justify-between p-4">
                    <div>
                      <h3 className="font-semibold">{hall.name}</h3>
                      <p className="text-sm text-muted-foreground">{hall.location}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">₹{hall.monthly_price}/mo</Badge>
                      <Badge variant="secondary">{hall.cabin_count} cabins</Badge>
                    </div>
                  </div>
                  <div className="p-4 pt-0">
                    <ActiveCabinBookingsList privateHallId={hall.id} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default InchargePrivateHallsTab;
