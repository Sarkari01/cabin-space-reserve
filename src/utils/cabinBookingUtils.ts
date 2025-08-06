import { addMonths, differenceInDays, format } from 'date-fns';

export interface BookingCalculation {
  days: number;
  months: number;
  totalAmount: number;
  monthlyAmount: number;
  startDate: Date;
  endDate: Date;
}

export const calculateCabinBooking = (
  startDate: Date,
  endDate: Date,
  cabinMonthlyPrice: number,
  hallMonthlyPrice: number
): BookingCalculation => {
  const days = differenceInDays(endDate, startDate) + 1; // Include both start and end dates
  const months = Math.ceil(days / 30); // Round up to ensure full months are charged
  
  // Use cabin price if available, otherwise fall back to hall price
  const monthlyAmount = cabinMonthlyPrice || hallMonthlyPrice;
  const totalAmount = months * monthlyAmount;

  return {
    days,
    months,
    totalAmount,
    monthlyAmount,
    startDate,
    endDate
  };
};

export const formatBookingPeriod = (startDate: Date, endDate: Date): string => {
  const startFormatted = format(startDate, 'MMM dd, yyyy');
  const endFormatted = format(endDate, 'MMM dd, yyyy');
  return `${startFormatted} - ${endFormatted}`;
};

export const validateBookingDates = (startDate: Date, endDate: Date): string | null => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (startDate < today) {
    return 'Start date cannot be in the past';
  }

  if (endDate <= startDate) {
    return 'End date must be after start date';
  }

  const daysDifference = differenceInDays(endDate, startDate);
  if (daysDifference < 1) {
    return 'Booking must be for at least 1 day';
  }

  // Maximum booking period (e.g., 12 months)
  const maxDays = 365;
  if (daysDifference > maxDays) {
    return 'Booking period cannot exceed 12 months';
  }

  return null;
};

export const getMinEndDate = (startDate: Date): Date => {
  return addMonths(startDate, 1);
};

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR'
  }).format(amount);
};

export const generateBookingNumber = (): string => {
  return `CB${Date.now().toString().slice(-8)}`;
};

export const cabinStatusColors = {
  available: 'bg-green-100 text-green-800 border-green-200',
  occupied: 'bg-red-100 text-red-800 border-red-200',
  maintenance: 'bg-yellow-100 text-yellow-800 border-yellow-200'
} as const;

export const bookingStatusColors = {
  pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  active: 'bg-green-100 text-green-800 border-green-200',
  completed: 'bg-blue-100 text-blue-800 border-blue-200',
  cancelled: 'bg-red-100 text-red-800 border-red-200'
} as const;