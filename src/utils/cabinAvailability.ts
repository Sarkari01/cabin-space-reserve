import { supabase } from '@/integrations/supabase/client';
import type { CabinLayoutData } from '@/types/PrivateHall';

export type CabinStatus = 'available' | 'occupied' | 'maintenance';
export type CabinStatusMap = Record<string, { status: CabinStatus; bookings?: number }>;

// Determines if a cabin booking should block availability
export function isCabinBookingBlocking(b: any): boolean {
  if (!b) return false;
  if (b.payment_status !== 'paid') return false;
  if (b.is_vacated === true) return false;
  if (!b.end_date) return false;
  const today = new Date();
  const todayDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  return new Date(b.end_date) >= todayDate;
}

// Builds a mapping from layout cabin IDs to DB cabin UUIDs using multiple strategies
export function buildLayoutCabinMapping(
  layout: CabinLayoutData,
  dbCabins: Array<{ id: string; cabin_name?: string | null; cabin_number?: number | null }>
): Record<string, string> {
  const mapping: Record<string, string> = {};
  const sortedDb = [...dbCabins].sort((a, b) => (a.cabin_number || 0) - (b.cabin_number || 0));

  for (let idx = 0; idx < layout.cabins.length; idx++) {
    const lc = layout.cabins[idx];
    let match = dbCabins.find((c) => c.cabin_name === lc.name);

    if (!match) {
      const m = lc.name?.match(/(\d+)/);
      const num = m ? parseInt(m[1], 10) : NaN;
      if (!isNaN(num)) {
        match = dbCabins.find((c) => c.cabin_number === num);
      }
    }

    if (!match) {
      // Fallback by position
      match = sortedDb[idx];
    }

    if (match) mapping[lc.id] = match.id;
  }

  return mapping;
}

// Convenience fetcher to load cabins and currently blocking bookings
export async function loadCabinsAndBlockingBookings(privateHallId: string) {
  const { data: cabins, error: cabinsError } = await supabase
    .from('cabins')
    .select('*')
    .eq('private_hall_id', privateHallId);

  if (cabinsError) throw cabinsError;

  const cabinIds = (cabins || []).map((c: any) => c.id);
  let bookings: any[] = [];

  if (cabinIds.length > 0) {
    const today = new Date();
    const todayStr = new Date(today.getFullYear(), today.getMonth(), today.getDate())
      .toISOString()
      .slice(0, 10);

    const { data: bookingsData, error: bookingsError } = await supabase
      .from('cabin_bookings')
      .select('*')
      .in('cabin_id', cabinIds)
      .eq('payment_status', 'paid')
      .eq('is_vacated', false)
      .gte('end_date', todayStr);

    if (bookingsError) throw bookingsError;
    bookings = bookingsData || [];
  }

  return { cabins: cabins || [], bookings };
}

// Computes availability map keyed by layout cabin id
export function computeAvailabilityMap(
  layout: CabinLayoutData,
  dbCabins: any[],
  bookings: any[],
  mapping: Record<string, string>
): CabinStatusMap {
  const availability: CabinStatusMap = {};

  layout.cabins.forEach((lc) => {
    const dbId = mapping[lc.id];
    if (!dbId) {
      availability[lc.id] = { status: 'available', bookings: 0 };
      return;
    }

    const cabinRecord = dbCabins.find((c) => c.id === dbId);

    if (cabinRecord?.status === 'maintenance') {
      availability[lc.id] = { status: 'maintenance', bookings: 0 };
      return;
    }

    const active = bookings.filter((b) => b.cabin_id === dbId && isCabinBookingBlocking(b));
    availability[lc.id] = {
      status: active.length > 0 ? 'occupied' : 'available',
      bookings: active.length,
    };
  });

  return availability;
}
