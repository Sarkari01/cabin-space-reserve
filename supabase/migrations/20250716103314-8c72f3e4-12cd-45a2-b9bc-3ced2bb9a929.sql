-- Add trial plan configuration fields to business_settings table
ALTER TABLE public.business_settings 
ADD COLUMN trial_plan_enabled boolean DEFAULT false,
ADD COLUMN trial_duration_days integer DEFAULT 14,
ADD COLUMN trial_plan_name text DEFAULT 'Free Trial',
ADD COLUMN trial_max_study_halls integer DEFAULT 1;

-- Add comment for documentation
COMMENT ON COLUMN public.business_settings.trial_plan_enabled IS 'Whether free trial plans are enabled for new merchants';
COMMENT ON COLUMN public.business_settings.trial_duration_days IS 'Duration of the free trial in days';
COMMENT ON COLUMN public.business_settings.trial_plan_name IS 'Display name for the trial plan';
COMMENT ON COLUMN public.business_settings.trial_max_study_halls IS 'Maximum study halls allowed during trial period';

-- Add a trial plan type to subscription_plans table
INSERT INTO public.subscription_plans (
  name,
  price,
  duration,
  features,
  status,
  max_study_halls,
  max_bookings_per_month,
  priority_support,
  analytics_access
) VALUES (
  'Free Trial',
  0.00,
  'trial',
  '["Limited study hall creation", "Basic booking management", "Email support", "Trial period analytics"]'::jsonb,
  'active',
  1,
  50,
  false,
  true
) ON CONFLICT DO NOTHING;

-- Create function to check if merchant has used trial before
CREATE OR REPLACE FUNCTION public.has_merchant_used_trial(p_merchant_id uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
  RETURN EXISTS(
    SELECT 1 
    FROM public.merchant_subscriptions 
    WHERE merchant_id = p_merchant_id 
      AND is_trial = true
  );
END;
$$;

-- Create function to get trial plan settings
CREATE OR REPLACE FUNCTION public.get_trial_plan_settings()
RETURNS TABLE(
  enabled boolean,
  duration_days integer,
  plan_name text,
  max_study_halls integer
)
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    trial_plan_enabled,
    trial_duration_days,
    trial_plan_name,
    trial_max_study_halls
  FROM public.business_settings
  LIMIT 1;
END;
$$;