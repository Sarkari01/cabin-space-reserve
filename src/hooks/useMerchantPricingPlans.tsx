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
   * Get pricing plan for a specific study hall with enhanced error handling
   */
  const getPricingPlan = async (studyHallId: string): Promise<MerchantPricingPlan | null> => {
    try {
      setLoading(true);
      console.log(`🔍 Fetching pricing plan for study hall ${studyHallId}`);

      const { data, error } = await supabase
        .from('merchant_pricing_plans')
        .select('*')
        .eq('study_hall_id', studyHallId)
        .maybeSingle();

      if (error) {
        console.error('❌ Database error fetching pricing plan:', error);
        throw error;
      }

      console.log('📋 Retrieved pricing plan data:', data);
      
      if (!data) {
        console.log('ℹ️ No pricing plan found for study hall', studyHallId);
        return null;
      }

      // Validate the pricing plan data
      const validatedPlan = {
        ...data,
        daily_price: data.daily_price && data.daily_price > 0 ? data.daily_price : null,
        weekly_price: data.weekly_price && data.weekly_price > 0 ? data.weekly_price : null,
        monthly_price: data.monthly_price && data.monthly_price > 0 ? data.monthly_price : null,
      };

      console.log('✅ Validated pricing plan:', validatedPlan);
      return validatedPlan;
    } catch (error: any) {
      console.error('❌ Error fetching pricing plan:', error);
      
      // Don't show toast for common "no data" scenarios
      if (error.code !== 'PGRST116') {
        toast({
          title: "Error",
          description: "Failed to fetch pricing plan",
          variant: "destructive",
        });
      }
      
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
   * Calculate booking amount based on merchant pricing plans with enhanced validation
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

    console.log(`🧮 Calculating amount with merchant pricing for ${days} days from ${startDate} to ${endDate}`);
    console.log('📋 Using pricing plan:', pricingPlan);

    // Calculate available pricing options - only include enabled ones with valid prices > 0
    const availableOptions: { method: string; amount: number; basePrice: number }[] = [];
    const priceBreakdown: any = {};
    const availableMethods: string[] = [];

    // Daily pricing - only if enabled and has valid price > 0
    if (pricingPlan.daily_enabled && pricingPlan.daily_price && pricingPlan.daily_price > 0) {
      const baseDailyPrice = pricingPlan.daily_price;
      const dailyTotal = days * baseDailyPrice;
      availableOptions.push({ method: 'daily', amount: dailyTotal, basePrice: baseDailyPrice });
      priceBreakdown.baseDaily = baseDailyPrice;
      availableMethods.push('daily');
      console.log(`💰 Daily option: ${days} days × ₹${baseDailyPrice} = ₹${dailyTotal}`);
    }

    // Weekly pricing - only if 7+ days, enabled and has valid price > 0
    if (days >= 7 && pricingPlan.weekly_enabled && pricingPlan.weekly_price && pricingPlan.weekly_price > 0) {
      const baseWeeklyPrice = pricingPlan.weekly_price;
      const weeks = Math.ceil(days / 7);
      const weeklyTotal = weeks * baseWeeklyPrice;
      availableOptions.push({ method: 'weekly', amount: weeklyTotal, basePrice: baseWeeklyPrice });
      priceBreakdown.baseWeekly = baseWeeklyPrice;
      availableMethods.push('weekly');
      console.log(`💰 Weekly option: ${weeks} weeks × ₹${baseWeeklyPrice} = ₹${weeklyTotal}`);
    }

    // Monthly pricing - only if 30+ days, enabled and has valid price > 0
    if (days >= 30 && pricingPlan.monthly_enabled && pricingPlan.monthly_price && pricingPlan.monthly_price > 0) {
      const baseMonthlyPrice = pricingPlan.monthly_price;
      const months = Math.ceil(days / 30);
      const monthlyTotal = months * baseMonthlyPrice;
      availableOptions.push({ method: 'monthly', amount: monthlyTotal, basePrice: baseMonthlyPrice });
      priceBreakdown.baseMonthly = baseMonthlyPrice;
      availableMethods.push('monthly');
      console.log(`💰 Monthly option: ${months} months × ₹${baseMonthlyPrice} = ₹${monthlyTotal}`);
    }

    // Choose the most cost-effective available option
    if (availableOptions.length === 0) {
      console.error('❌ No valid pricing options found for merchant pricing plan');
      throw new Error('No pricing plans are enabled or configured for this study hall');
    }

    const bestOption = availableOptions.reduce((min, option) => 
      option.amount < min.amount ? option : min
    );

    console.log(`🎯 Best option selected: ${bestOption.method} at ₹${bestOption.amount}`);

    const baseAmount = bestOption.amount;
    const discountAmount = 0; // No automatic discount in merchant pricing
    const finalAmount = baseAmount;

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
