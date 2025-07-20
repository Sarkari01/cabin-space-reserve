import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from './use-toast';

export interface MerchantPricingPlan {
  id?: string;
  merchant_id: string;
  study_hall_id: string;
  daily_enabled: boolean;
  daily_price?: number;
  weekly_enabled: boolean;
  weekly_price?: number;
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
    try {
      setLoading(true);
      console.log(`Fetching pricing plan for study hall ${studyHallId}`);

      const { data, error } = await supabase
        .from('merchant_pricing_plans')
        .select('*')
        .eq('study_hall_id', studyHallId)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        throw error;
      }

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

  /**
   * Save or update pricing plan for a study hall
   */
  const savePricingPlan = async (pricingPlan: MerchantPricingPlan): Promise<boolean> => {
    try {
      setLoading(true);
      console.log('Saving pricing plan:', pricingPlan);

      // Validate that at least one plan is enabled
      if (!pricingPlan.daily_enabled && !pricingPlan.weekly_enabled && !pricingPlan.monthly_enabled) {
        toast({
          title: "Validation Error",
          description: "At least one pricing plan must be enabled",
          variant: "destructive",
        });
        return false;
      }

      // Validate that enabled plans have prices
      if (pricingPlan.daily_enabled && (!pricingPlan.daily_price || pricingPlan.daily_price <= 0)) {
        toast({
          title: "Validation Error",
          description: "Daily price must be greater than 0 when daily plan is enabled",
          variant: "destructive",
        });
        return false;
      }

      if (pricingPlan.weekly_enabled && (!pricingPlan.weekly_price || pricingPlan.weekly_price <= 0)) {
        toast({
          title: "Validation Error",
          description: "Weekly price must be greater than 0 when weekly plan is enabled",
          variant: "destructive",
        });
        return false;
      }

      if (pricingPlan.monthly_enabled && (!pricingPlan.monthly_price || pricingPlan.monthly_price <= 0)) {
        toast({
          title: "Validation Error",
          description: "Monthly price must be greater than 0 when monthly plan is enabled",
          variant: "destructive",
        });
        return false;
      }

      const { error } = await supabase
        .from('merchant_pricing_plans')
        .upsert({
          merchant_id: pricingPlan.merchant_id,
          study_hall_id: pricingPlan.study_hall_id,
          daily_enabled: pricingPlan.daily_enabled,
          daily_price: pricingPlan.daily_enabled ? pricingPlan.daily_price : null,
          weekly_enabled: pricingPlan.weekly_enabled,
          weekly_price: pricingPlan.weekly_enabled ? pricingPlan.weekly_price : null,
          monthly_enabled: pricingPlan.monthly_enabled,
          monthly_price: pricingPlan.monthly_enabled ? pricingPlan.monthly_price : null,
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

  /**
   * Get all pricing plans for a merchant
   */
  const getMerchantPricingPlans = async (merchantId: string): Promise<MerchantPricingPlan[]> => {
    try {
      setLoading(true);
      console.log(`Fetching all pricing plans for merchant ${merchantId}`);

      const { data, error } = await supabase
        .from('merchant_pricing_plans')
        .select('*')
        .eq('merchant_id', merchantId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return data || [];
    } catch (error: any) {
      console.error('Error fetching merchant pricing plans:', error);
      toast({
        title: "Error",
        description: "Failed to fetch pricing plans",
        variant: "destructive",
      });
      return [];
    } finally {
      setLoading(false);
    }
  };

  /**
   * Calculate booking amount based on merchant pricing plans
   */
  const calculateBookingAmountWithMerchantPlans = (
    startDate: string,
    endDate: string,
    pricingPlan: MerchantPricingPlan
  ): { 
    amount: number; 
    baseAmount: number;
    discountAmount: number;
    finalAmount: number;
    days: number; 
    method: string;
    availableMethods: string[];
    priceBreakdown: {
      baseDaily?: number;
      baseWeekly?: number;
      baseMonthly?: number;
    };
  } => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const timeDiff = end.getTime() - start.getTime();
    const days = Math.ceil(timeDiff / (1000 * 3600 * 24)) + 1;

    console.log(`Calculating amount with merchant pricing for ${days} days from ${startDate} to ${endDate}`);

    // Calculate available pricing options
    const availableOptions: { method: string; amount: number; basePrice: number }[] = [];
    const priceBreakdown: any = {};
    const availableMethods: string[] = [];

    // Daily pricing
    if (pricingPlan.daily_enabled && pricingPlan.daily_price) {
      const baseDailyPrice = pricingPlan.daily_price - 100;
      const dailyTotal = days * baseDailyPrice;
      availableOptions.push({ method: 'daily', amount: dailyTotal, basePrice: baseDailyPrice });
      priceBreakdown.baseDaily = baseDailyPrice;
      availableMethods.push('daily');
    }

    // Weekly pricing (only if 7+ days and enabled)
    if (days >= 7 && pricingPlan.weekly_enabled && pricingPlan.weekly_price) {
      const baseWeeklyPrice = pricingPlan.weekly_price - 100;
      const weeklyTotal = Math.ceil(days / 7) * baseWeeklyPrice;
      availableOptions.push({ method: 'weekly', amount: weeklyTotal, basePrice: baseWeeklyPrice });
      priceBreakdown.baseWeekly = baseWeeklyPrice;
      availableMethods.push('weekly');
    }

    // Monthly pricing (only if 30+ days and enabled)
    if (days >= 30 && pricingPlan.monthly_enabled && pricingPlan.monthly_price) {
      const baseMonthlyPrice = pricingPlan.monthly_price - 100;
      const monthlyTotal = Math.ceil(days / 30) * baseMonthlyPrice;
      availableOptions.push({ method: 'monthly', amount: monthlyTotal, basePrice: baseMonthlyPrice });
      priceBreakdown.baseMonthly = baseMonthlyPrice;
      availableMethods.push('monthly');
    }

    // Choose the most cost-effective available option
    if (availableOptions.length === 0) {
      throw new Error('No pricing plans are enabled for this study hall');
    }

    const bestOption = availableOptions.reduce((min, option) => 
      option.amount < min.amount ? option : min
    );

    const baseAmount = bestOption.amount;
    const discountAmount = Math.round(baseAmount * 0.02);
    const finalAmount = baseAmount + discountAmount;

    return { 
      amount: finalAmount, 
      baseAmount,
      discountAmount,
      finalAmount,
      days, 
      method: bestOption.method,
      availableMethods,
      priceBreakdown
    };
  };

  return {
    loading,
    getPricingPlan,
    savePricingPlan,
    getMerchantPricingPlans,
    calculateBookingAmountWithMerchantPlans,
  };
};