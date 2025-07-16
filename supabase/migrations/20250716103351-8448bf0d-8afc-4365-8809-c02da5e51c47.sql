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

-- Create function to activate trial subscription for merchant
CREATE OR REPLACE FUNCTION public.activate_trial_subscription(p_merchant_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
AS $$
DECLARE
  trial_settings RECORD;
  new_subscription_id uuid;
  trial_plan_id uuid;
BEGIN
  -- Check if merchant has already used trial
  IF has_merchant_used_trial(p_merchant_id) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Trial already used');
  END IF;
  
  -- Get trial settings
  SELECT * INTO trial_settings FROM get_trial_plan_settings();
  
  IF NOT trial_settings.enabled THEN
    RETURN jsonb_build_object('success', false, 'error', 'Trial not enabled');
  END IF;
  
  -- Find or create basic plan to use as template
  SELECT id INTO trial_plan_id 
  FROM subscription_plans 
  WHERE name = 'Basic' AND status = 'active'
  LIMIT 1;
  
  IF trial_plan_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'No base plan found');
  END IF;
  
  -- Create trial subscription
  INSERT INTO merchant_subscriptions (
    merchant_id,
    plan_id,
    status,
    is_trial,
    start_date,
    end_date,
    trial_start_date,
    trial_end_date,
    max_study_halls,
    payment_method
  ) VALUES (
    p_merchant_id,
    trial_plan_id,
    'active',
    true,
    now(),
    now() + (trial_settings.duration_days || ' days')::interval,
    now(),
    now() + (trial_settings.duration_days || ' days')::interval,
    trial_settings.max_study_halls,
    'trial'
  ) RETURNING id INTO new_subscription_id;
  
  RETURN jsonb_build_object(
    'success', true, 
    'subscription_id', new_subscription_id,
    'trial_end_date', now() + (trial_settings.duration_days || ' days')::interval
  );
END;
$$;