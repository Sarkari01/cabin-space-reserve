import { useCallback, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { differenceInCalendarDays } from 'date-fns';

export type HallCabinStatus = {
  status: 'available' | 'occupied';
  bookedUntil?: string;
  daysRemaining?: number;
};

export function usePrivateHallAvailability() {
  const [statuses, setStatuses] = useState<Record<string, HallCabinStatus>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStatuses = useCallback(async (privateHallIds: string[]) => {
    try {
      setLoading(true);
      setError(null);
      if (!privateHallIds || privateHallIds.length === 0) {
        setStatuses({});
        return {} as Record<string, HallCabinStatus>;
      }

      const today = new Date();
      const todayStr = new Date(today.getFullYear(), today.getMonth(), today.getDate())
        .toISOString()
        .slice(0, 10);

      const { data, error } = await supabase
        .from('cabin_bookings')
        .select('id, private_hall_id, end_date, payment_status, is_vacated')
        .in('private_hall_id', privateHallIds)
        .eq('payment_status', 'paid')
        .eq('is_vacated', false)
        .gte('end_date', todayStr);

      if (error) throw error;

      // Group by private_hall_id and compute latest end_date
      const grouped = new Map<string, string | null>();
      (data || []).forEach((b) => {
        const hallId = (b as any).private_hall_id as string;
        const end = (b as any).end_date as string | null;
        if (!hallId || !end) return;
        const prev = grouped.get(hallId);
        if (!prev || new Date(end) > new Date(prev)) {
          grouped.set(hallId, end);
        }
      });

      const next: Record<string, HallCabinStatus> = {};
      privateHallIds.forEach((id) => {
        const bookedUntil = grouped.get(id) || undefined;
        if (bookedUntil) {
          next[id] = {
            status: 'occupied',
            bookedUntil,
            daysRemaining: Math.max(0, differenceInCalendarDays(new Date(bookedUntil), today)),
          };
        } else {
          next[id] = { status: 'available' };
        }
      });

      setStatuses(next);
      return next;
    } catch (e: any) {
      setError(e?.message || 'Failed to load availability');
      return {} as Record<string, HallCabinStatus>;
    } finally {
      setLoading(false);
    }
  }, []);

  return { statuses, loading, error, fetchStatuses };
}
