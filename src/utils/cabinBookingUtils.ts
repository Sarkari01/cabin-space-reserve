import { addMonths, differenceInDays, format } from 'date-fns';

export interface BookingCalculation {
  days: number;
  months: number;
  totalAmount: number;
  monthlyAmount: number;
  depositAmount: number;
  bookingAmount: number;
  startDate: Date;
  endDate: Date;
}

export const calculateCabinBooking = (
  startDate: Date,
  endDate: Date,
  cabinMonthlyPrice: number,
  hallMonthlyPrice: number,
  depositAmount: number = 0
): BookingCalculation => {
  const days = differenceInDays(endDate, startDate) + 1; // Include both start and end dates
  const months = Math.ceil(days / 30); // Round up to ensure full months are charged
  
  // Use cabin price if available, otherwise fall back to hall price
  const monthlyAmount = cabinMonthlyPrice || hallMonthlyPrice;
  const bookingAmount = months * monthlyAmount;
  const totalAmount = bookingAmount + depositAmount;

  return {
    days,
    months,
    totalAmount,
    monthlyAmount,
    depositAmount,
    bookingAmount,
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

export const calculateAutoEndDate = (startDate: Date): Date => {
  return addMonths(startDate, 1);
};

export const validateCabinBookingStartDate = (startDate: Date): string | null => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (startDate < today) {
    return 'Start date cannot be in the past';
  }

  // For cabin bookings, we automatically set end date to 1 month later
  // so no need to validate end date separately
  return null;
};

export const calculateSimpleCabinBooking = (
  startDate: Date,
  cabinMonthlyPrice: number,
  hallMonthlyPrice: number,
  depositAmount: number = 0
): BookingCalculation => {
  const endDate = addMonths(startDate, 1);
  const days = differenceInDays(endDate, startDate) + 1; // Include both start and end dates
  const months = 1; // Always 1 month for simplified bookings
  
  // Use cabin price if available, otherwise fall back to hall price
  const monthlyAmount = cabinMonthlyPrice || hallMonthlyPrice;
  const bookingAmount = monthlyAmount; // 1 month * monthly price
  const totalAmount = bookingAmount + depositAmount;

  return {
    days,
    months,
    totalAmount,
    monthlyAmount,
    depositAmount,
    bookingAmount,
    startDate,
    endDate
  };
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

// Phase 3: Data validation functions
export const validateBookingAmounts = (
  totalAmount: number,
  bookingAmount: number,
  depositAmount: number
): string | null => {
  // Ensure all amounts are non-negative
  if (totalAmount < 0 || bookingAmount < 0 || depositAmount < 0) {
    return 'All amounts must be non-negative';
  }

  // Ensure total equals booking + deposit
  if (Math.abs(totalAmount - (bookingAmount + depositAmount)) > 0.01) {
    return `Total amount (₹${totalAmount}) must equal booking amount (₹${bookingAmount}) plus deposit (₹${depositAmount})`;
  }

  return null;
};

export const validateCabinBookingData = (bookingData: any): string | null => {
  if (!bookingData.cabin_id) return 'Cabin ID is required';
  if (!bookingData.private_hall_id) return 'Private hall ID is required';
  if (!bookingData.start_date) return 'Start date is required';
  if (!bookingData.end_date) return 'End date is required';
  if (!bookingData.total_amount || bookingData.total_amount <= 0) return 'Valid total amount is required';

  // Validate booking amounts if provided
  if (bookingData.booking_amount && bookingData.deposit_amount) {
    const amountValidation = validateBookingAmounts(
      bookingData.total_amount,
      bookingData.booking_amount,
      bookingData.deposit_amount
    );
    if (amountValidation) return amountValidation;
  }

  return null;
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

export const depositStatusColors = {
  pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  processing: 'bg-blue-100 text-blue-800 border-blue-200',
  completed: 'bg-green-100 text-green-800 border-green-200',
  rejected: 'bg-red-100 text-red-800 border-red-200',
  held: 'bg-blue-100 text-blue-800 border-blue-200',
  refunded: 'bg-green-100 text-green-800 border-green-200'
} as const;