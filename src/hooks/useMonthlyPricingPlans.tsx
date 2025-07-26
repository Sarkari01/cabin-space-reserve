import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from './use-toast';
import { useAuth } from './useAuth';

export interface MonthlyPricingPlan {
  id?: string;
  merchant_id: string;
  study_hall_id: string;
  months_1_enabled: boolean;
  months_1_price?: number;
  months_2_enabled: boolean;
  months_2_price?: number;
  months_3_enabled: boolean;
  months_3_price?: number;
  months_6_enabled: boolean;
  months_6_price?: number;
  months_12_enabled: boolean;
  months_12_price?: number;
  created_at?: string;
  updated_at?: string;
}

export const useMonthlyPricingPlans = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const getPricingPlan = async (studyHallId: string): Promise<MonthlyPricingPlan | null> => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('monthly_pricing_plans')
        .select('*')
        .eq('study_hall_id', studyHallId)
        .maybeSingle();

      if (error) throw error;
      return data || null;
    } catch (error: any) {
      console.error('Error fetching pricing plan:', error);
      toast({
        title: "Error",
        description: "Failed to fetch pricing plan",
        variant: "destructive",
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  const savePricingPlan = async (pricingPlan: MonthlyPricingPlan): Promise<boolean> => {
    if (!user) return false;

    setLoading(true);
    try {
      // Validation: At least one period must be enabled with a price
      const hasValidPricing = [
        pricingPlan.months_1_enabled && pricingPlan.months_1_price && pricingPlan.months_1_price > 0,
        pricingPlan.months_2_enabled && pricingPlan.months_2_price && pricingPlan.months_2_price > 0,
        pricingPlan.months_3_enabled && pricingPlan.months_3_price && pricingPlan.months_3_price > 0,
        pricingPlan.months_6_enabled && pricingPlan.months_6_price && pricingPlan.months_6_price > 0,
        pricingPlan.months_12_enabled && pricingPlan.months_12_price && pricingPlan.months_12_price > 0,
      ].some(Boolean);

      if (!hasValidPricing) {
        toast({
          title: "Validation Error",
          description: "At least one pricing period must be enabled with a valid price",
          variant: "destructive",
        });
        return false;
      }

      const { error } = await supabase
        .from('monthly_pricing_plans')
        .upsert({
          ...pricingPlan,
          merchant_id: user.id,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'merchant_id,study_hall_id'
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Pricing plan saved successfully",
      });

      return true;
    } catch (error: any) {
      console.error('Error saving pricing plan:', error);
      toast({
        title: "Error",
        description: "Failed to save pricing plan",
        variant: "destructive",
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  const getMerchantPricingPlans = async (merchantId: string): Promise<MonthlyPricingPlan[]> => {
    try {
      const { data, error } = await supabase
        .from('monthly_pricing_plans')
        .select('*')
        .eq('merchant_id', merchantId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error: any) {
      console.error('Error fetching merchant pricing plans:', error);
      return [];
    }
  };

  const calculateMonthlyBookingAmount = (
    startDate: string,
    endDate: string,
    pricingPlan: MonthlyPricingPlan
  ): {
    amount: number;
    months: number;
    periodType: string;
    availablePeriods: string[];
    breakdown: {
      months1?: number;
      months2?: number;
      months3?: number;
      months6?: number;
      months12?: number;
    };
  } => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const timeDiff = end.getTime() - start.getTime();
    const days = Math.ceil(timeDiff / (1000 * 3600 * 24)) + 1;
    const months = Math.ceil(days / 30);

    // Get available periods
    const availablePeriods: string[] = [];
    if (pricingPlan.months_1_enabled && pricingPlan.months_1_price) availablePeriods.push('1_month');
    if (pricingPlan.months_2_enabled && pricingPlan.months_2_price) availablePeriods.push('2_months');
    if (pricingPlan.months_3_enabled && pricingPlan.months_3_price) availablePeriods.push('3_months');
    if (pricingPlan.months_6_enabled && pricingPlan.months_6_price) availablePeriods.push('6_months');
    if (pricingPlan.months_12_enabled && pricingPlan.months_12_price) availablePeriods.push('12_months');

    // Calculate pricing for each available option
    const breakdown: any = {};
    
    if (pricingPlan.months_1_enabled && pricingPlan.months_1_price) {
      breakdown.months1 = months * pricingPlan.months_1_price;
    }
    if (pricingPlan.months_2_enabled && pricingPlan.months_2_price) {
      breakdown.months2 = Math.ceil(months / 2) * pricingPlan.months_2_price;
    }
    if (pricingPlan.months_3_enabled && pricingPlan.months_3_price) {
      breakdown.months3 = Math.ceil(months / 3) * pricingPlan.months_3_price;
    }
    if (pricingPlan.months_6_enabled && pricingPlan.months_6_price && months >= 6) {
      breakdown.months6 = Math.ceil(months / 6) * pricingPlan.months_6_price;
    }
    if (pricingPlan.months_12_enabled && pricingPlan.months_12_price && months >= 12) {
      breakdown.months12 = Math.ceil(months / 12) * pricingPlan.months_12_price;
    }

    // Find the most cost-effective option
    let bestAmount = Infinity;
    let bestPeriod = '1_month';

    if (months >= 12 && breakdown.months12 && breakdown.months12 < bestAmount) {
      bestAmount = breakdown.months12;
      bestPeriod = '12_months';
    }
    if (months >= 6 && breakdown.months6 && breakdown.months6 < bestAmount) {
      bestAmount = breakdown.months6;
      bestPeriod = '6_months';
    }
    if (months >= 3 && breakdown.months3 && breakdown.months3 < bestAmount) {
      bestAmount = breakdown.months3;
      bestPeriod = '3_months';
    }
    if (months >= 2 && breakdown.months2 && breakdown.months2 < bestAmount) {
      bestAmount = breakdown.months2;
      bestPeriod = '2_months';
    }
    if (breakdown.months1 && breakdown.months1 < bestAmount) {
      bestAmount = breakdown.months1;
      bestPeriod = '1_month';
    }

    return {
      amount: bestAmount,
      months,
      periodType: bestPeriod,
      availablePeriods,
      breakdown
    };
  };

  return {
    loading,
    getPricingPlan,
    savePricingPlan,
    getMerchantPricingPlans,
    calculateMonthlyBookingAmount,
  };
};