
import { differenceInCalendarDays } from 'date-fns';

export type UnifiedBooking = {
  id: string;
  type?: 'study_hall' | 'cabin';
  location_id?: string; // private_hall_id for cabin bookings
  status?: string;
  payment_status?: string;
  is_vacated?: boolean | null;
  end_date?: string | null;
};

interface HallCabinStatus {
  status: 'available' | 'booked';
  bookedUntil?: string;
  daysRemaining?: number;
}

/**
 * Computes aggregated cabin status for a private hall:
 * - booked if any cabin booking is paid, not vacated, and end_date >= today
 * - available otherwise
 * Returns latest end_date among active cabin bookings for "Booked until" display
 */
export function computeHallCabinStatus(
  bookings: UnifiedBooking[] = [],
  privateHallId: string
): HallCabinStatus {
  const today = new Date();

  const activeCabinBookings = bookings.filter((b) => {
    if (b.type !== 'cabin') return false;
    if (b.location_id !== privateHallId) return false;
    if (b.payment_status !== 'paid') return false;
    if (b.is_vacated === true) return false;

    // end_date must be in the future or today to be considered blocking availability
    if (!b.end_date) return false;
    const end = new Date(b.end_date);
    return end >= new Date(today.getFullYear(), today.getMonth(), today.getDate());
  });

  if (activeCabinBookings.length === 0) {
    return { status: 'available' };
  }

  // Use the latest end_date for "Booked until"
  const latest = activeCabinBookings.reduce((acc, cur) => {
    const accDate = acc?.end_date ? new Date(acc.end_date) : new Date(0);
    const curDate = cur.end_date ? new Date(cur.end_date) : new Date(0);
    return curDate > accDate ? cur : acc;
  });

  const bookedUntil = latest.end_date!;
  const daysRemaining = Math.max(
    0,
    differenceInCalendarDays(new Date(bookedUntil), today)
  );

  return {
    status: 'booked',
    bookedUntil,
    daysRemaining,
  };
}
