
import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CalendarClock, Check, User } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { CabinVacateButton } from '@/components/CabinVacateButton';

interface ActiveCabinBooking {
  id: string;
  start_date: string;
  end_date: string;
  is_vacated: boolean;
  guest_name?: string | null;
  user?: {
    full_name?: string | null;
    email?: string | null;
    phone?: string | null;
  } | null;
}

interface Props {
  privateHallId: string;
}

export const ActiveCabinBookingsList: React.FC<Props> = ({ privateHallId }) => {
  const { userRole } = useAuth();
  const [loading, setLoading] = useState(false);
  const [bookings, setBookings] = useState<ActiveCabinBooking[]>([]);

  const canManage = userRole === 'admin' || userRole === 'merchant';

  const fetchActiveBookings = async () => {
    setLoading(true);
    try {
      // Fetch active, paid, not-vacated cabin bookings for this hall that haven't expired yet
      const { data, error } = await supabase
        .from('cabin_bookings')
        .select(`
          id,
          start_date,
          end_date,
          is_vacated,
          guest_name,
          user:profiles!cabin_bookings_user_id_fkey(full_name, email, phone)
        `)
        .eq('private_hall_id', privateHallId)
        .eq('is_vacated', false)
        .eq('payment_status', 'paid')
        .eq('status', 'active')
        .gte('end_date', new Date().toISOString().slice(0, 10))
        .order('end_date', { ascending: true });

      if (error) throw error;
      setBookings((data || []) as any);
    } catch (e) {
      console.error('Failed to load active cabin bookings', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!privateHallId) return;
    fetchActiveBookings();
  }, [privateHallId]);

  useEffect(() => {
    if (!privateHallId) return;
    // Realtime updates for cabin_bookings of this hall
    const channel = supabase
      .channel('active-cabin-bookings-list')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'cabin_bookings',
        filter: `private_hall_id=eq.${privateHallId}`
      }, () => {
        fetchActiveBookings();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [privateHallId]);

  if (!canManage) return null;

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold flex items-center gap-2">
          <CalendarClock className="h-4 w-4" />
          Active Cabin Bookings
        </h3>
        {loading && <Badge variant="outline">Loading…</Badge>}
      </div>

      {bookings.length === 0 ? (
        <div className="text-sm text-muted-foreground">
          No active cabin bookings.
        </div>
      ) : (
        <div className="space-y-2">
          {bookings.map((b) => {
            const userLabel = b.guest_name || b.user?.full_name || 'Guest';
            return (
              <div
                key={b.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border rounded-md p-3"
              >
                <div className="flex items-center gap-3">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <div className="font-medium">{userLabel}</div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(b.start_date).toLocaleDateString()} → {new Date(b.end_date).toLocaleDateString()}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {/* Reuse existing vacate button which handles role and confirmation */}
                  <CabinVacateButton 
                    bookingId={b.id}
                    size="sm"
                    variant="outline"
                    onVacated={() => {
                      // local refresh after vacate
                      fetchActiveBookings();
                    }}
                  />
                  <Badge variant="outline" className="flex items-center gap-1">
                    <Check className="h-3 w-3" />
                    Paid
                  </Badge>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
};
