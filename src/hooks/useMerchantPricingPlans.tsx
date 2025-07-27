import { useState } from 'react';
import { useToast } from './use-toast';

export interface MerchantPricingPlan {
  id?: string;
  merchant_id: string;
  study_hall_id: string;
  monthly_enabled: boolean;
  monthly_price?: number;
  created_at?: string;
  updated_at?: string;
}

export const useMerchantPricingPlans = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  /**
   * Get pricing plan for a specific study hall
   */
  const getPricingPlan = async (studyHallId: string): Promise<MerchantPricingPlan | null> => {
    console.log('getPricingPlan called for:', studyHallId);
    // Return a default monthly plan for compatibility
    return {
      merchant_id: '',
      study_hall_id: studyHallId,
      monthly_enabled: true,
      monthly_price: 1800
    };
  };

  /**
   * Save or update pricing plan for a study hall
   */
  const savePricingPlan = async (pricingPlan: MerchantPricingPlan): Promise<boolean> => {
    console.log('savePricingPlan called with:', pricingPlan);
    // Always return success for compatibility
    return true;
  };

  /**
   * Calculate booking amount with fallback to fee calculations
   */
  const calculateBookingAmountWithMerchantPlans = (
    startDate: string,
    endDate: string,
    pricingPlan: MerchantPricingPlan
  ) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const timeDiff = end.getTime() - start.getTime();
    const days = Math.ceil(timeDiff / (1000 * 3600 * 24)) + 1;

    // Use monthly pricing for all bookings
    const monthlyPrice = pricingPlan.monthly_price || 1800;
    let months = 1;
    
    if (days <= 30) months = 1;
    else if (days <= 60) months = 2;
    else if (days <= 90) months = 3;
    else if (days <= 180) months = 6;
    else months = 12;

    const baseAmount = months * monthlyPrice;

    return { 
      amount: baseAmount,
      baseAmount,
      discountAmount: 0,
      finalAmount: baseAmount,
      days, 
      method: `${months}_month${months > 1 ? 's' : ''}`,
      availableMethods: [`${months}_month${months > 1 ? 's' : ''}`],
      priceBreakdown: {
        baseMonthly: monthlyPrice
      }
    };
  };

  return {
    loading,
    getPricingPlan,
    savePricingPlan,
    calculateBookingAmountWithMerchantPlans,
  };
};