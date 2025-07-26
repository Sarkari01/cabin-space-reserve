/**
 * Fee calculation utilities for monthly-only booking system
 * Handles 2% transaction fee by showing it as a "discount"
 */

// Razorpay transaction fee percentage
export const RAZORPAY_FEE_RATE = 0.02; // 2%

/**
 * Calculate the original price from merchant's base price (removing the hidden ₹100 margin)
 * Merchant's base price (₹1800) -> Original price (₹1700)
 */
export const calculateBasePrice = (merchantPrice: number): number => {
  return merchantPrice - 100; // Fixed ₹100 deduction
};

/**
 * Calculate the "discount" amount that covers the Razorpay fee
 * Original price (₹1700) -> Discount amount (₹34)
 */
export const calculateDiscountAmount = (originalPrice: number): number => {
  return Math.round(originalPrice * RAZORPAY_FEE_RATE);
};

/**
 * Calculate the final amount user pays (original price + 2%)
 */
export const calculateFinalAmount = (originalPrice: number): number => {
  const feeAmount = Math.round(originalPrice * RAZORPAY_FEE_RATE); // 2% fee
  return originalPrice + feeAmount; // No rounding, just original + 2%
};

/**
 * Calculate the actual discount from merchant price
 */
export const calculateActualDiscount = (merchantPrice: number, finalAmount: number): number => {
  return merchantPrice - finalAmount;
};

/**
 * Format price display for user: clean pricing without 2% mention
 */
export const formatPriceWithDiscount = (merchantPrice: number): {
  basePrice: number;
  discountAmount: number;
  finalAmount: number;
  actualDiscount: number;
  displayText: string;
} => {
  const originalPrice = calculateBasePrice(merchantPrice);
  const discountAmount = calculateDiscountAmount(originalPrice);
  const finalAmount = calculateFinalAmount(originalPrice);
  const actualDiscount = calculateActualDiscount(merchantPrice, finalAmount);
  
  return {
    basePrice: originalPrice,
    discountAmount,
    finalAmount,
    actualDiscount,
    displayText: `₹${originalPrice}`
  };
};

/**
 * Calculate monthly booking amount with fee handling
 */
export const calculateMonthlyBookingAmountWithFees = (
  startDate: string,
  endDate: string,
  monthlyPrice: number
): {
  baseAmount: number;
  discountAmount: number;
  finalAmount: number;
  days: number;
  months: number;
  method: string;
} => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const timeDiff = end.getTime() - start.getTime();
  const days = Math.ceil(timeDiff / (1000 * 3600 * 24)) + 1;
  const months = Math.ceil(days / 30);

  // Calculate customer original price (merchant price - ₹100)
  const baseMonthlyPrice = calculateBasePrice(monthlyPrice);
  const baseAmount = months * baseMonthlyPrice;

  const discountAmount = calculateDiscountAmount(baseAmount);
  const finalAmount = calculateFinalAmount(baseAmount);

  return {
    baseAmount,
    discountAmount,
    finalAmount,
    days,
    months,
    method: 'monthly'
  };
};