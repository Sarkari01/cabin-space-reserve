-- Phase 1: Transform booking system to monthly-only
-- Update booking_period enum to only support monthly periods
DROP TYPE IF EXISTS booking_period CASCADE;
CREATE TYPE booking_period AS ENUM ('1_month', '2_months', '3_months', '6_months', '12_months');

-- Create new monthly pricing plans table
CREATE TABLE IF NOT EXISTS public.monthly_pricing_plans (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  merchant_id uuid NOT NULL,
  study_hall_id uuid NOT NULL,
  months_1_price numeric(10,2),
  months_2_price numeric(10,2), 
  months_3_price numeric(10,2),
  months_6_price numeric(10,2),
  months_12_price numeric(10,2),
  months_1_enabled boolean DEFAULT true,
  months_2_enabled boolean DEFAULT true,
  months_3_enabled boolean DEFAULT true,
  months_6_enabled boolean DEFAULT false,
  months_12_enabled boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE(merchant_id, study_hall_id)
);

-- Enable RLS
ALTER TABLE public.monthly_pricing_plans ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for monthly pricing plans
CREATE POLICY "Admins can manage all monthly pricing plans" 
ON public.monthly_pricing_plans 
FOR ALL 
USING (is_admin());

CREATE POLICY "Merchants can manage their own monthly pricing plans" 
ON public.monthly_pricing_plans 
FOR ALL 
USING (merchant_id = auth.uid())
WITH CHECK (merchant_id = auth.uid());

CREATE POLICY "Users can view monthly pricing plans for available study halls" 
ON public.monthly_pricing_plans 
FOR SELECT 
USING (
  study_hall_id IN (
    SELECT id FROM study_halls WHERE status = 'active'
  )
);

-- Migrate existing pricing data to monthly format
INSERT INTO public.monthly_pricing_plans (
  merchant_id, 
  study_hall_id, 
  months_1_price,
  months_2_price,
  months_3_price
)
SELECT 
  merchant_id,
  study_hall_id,
  COALESCE(monthly_price, weekly_price * 4.33, daily_price * 30) as months_1_price,
  COALESCE(monthly_price * 2, weekly_price * 8.66, daily_price * 60) as months_2_price,
  COALESCE(monthly_price * 3, weekly_price * 13, daily_price * 90) as months_3_price
FROM merchant_pricing_plans
ON CONFLICT (merchant_id, study_hall_id) DO NOTHING;

-- Remove old pricing columns from study_halls (keep only monthly)
ALTER TABLE public.study_halls 
DROP COLUMN IF EXISTS daily_price,
DROP COLUMN IF EXISTS weekly_price;

-- Add trigger for updated_at
CREATE OR REPLACE FUNCTION public.update_monthly_pricing_plans_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_monthly_pricing_plans_updated_at
  BEFORE UPDATE ON public.monthly_pricing_plans
  FOR EACH ROW
  EXECUTE FUNCTION public.update_monthly_pricing_plans_updated_at();

-- Create function to calculate monthly booking amount
CREATE OR REPLACE FUNCTION public.calculate_monthly_booking_amount(
  p_start_date date,
  p_end_date date, 
  p_months_1_price numeric,
  p_months_2_price numeric,
  p_months_3_price numeric,
  p_months_6_price numeric DEFAULT NULL,
  p_months_12_price numeric DEFAULT NULL
)
RETURNS TABLE(amount numeric, months integer, period_type text)
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  v_days INTEGER;
  v_months NUMERIC;
  v_final_amount NUMERIC;
  v_months_count INTEGER;
  v_period_type TEXT;
BEGIN
  -- Calculate number of days (inclusive)
  v_days := p_end_date - p_start_date + 1;
  v_months := v_days / 30.0; -- Approximate months
  
  -- Round up to nearest month for billing
  v_months_count := CEIL(v_months)::INTEGER;
  
  -- Choose the best pricing option
  IF v_months_count >= 12 AND p_months_12_price IS NOT NULL THEN
    v_final_amount := CEIL(v_months / 12.0) * p_months_12_price;
    v_period_type := '12_months';
  ELSIF v_months_count >= 6 AND p_months_6_price IS NOT NULL THEN
    v_final_amount := CEIL(v_months / 6.0) * p_months_6_price;
    v_period_type := '6_months';
  ELSIF v_months_count >= 3 AND p_months_3_price IS NOT NULL THEN
    v_final_amount := CEIL(v_months / 3.0) * p_months_3_price;
    v_period_type := '3_months';
  ELSIF v_months_count >= 2 AND p_months_2_price IS NOT NULL THEN
    v_final_amount := CEIL(v_months / 2.0) * p_months_2_price;
    v_period_type := '2_months';
  ELSE
    v_final_amount := v_months_count * p_months_1_price;
    v_period_type := '1_month';
  END IF;
  
  RETURN QUERY SELECT v_final_amount, v_months_count, v_period_type;
END;
$$;