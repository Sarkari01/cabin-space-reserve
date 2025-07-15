-- Fix the parameter naming conflict in get_merchant_subscription_limits function
DROP FUNCTION IF EXISTS public.get_merchant_subscription_limits(uuid);

-- Recreate the function with proper parameter naming
CREATE OR REPLACE FUNCTION public.get_merchant_subscription_limits(p_merchant_id uuid)
RETURNS TABLE(
  max_study_halls integer, 
  current_study_halls bigint, 
  is_trial boolean, 
  trial_expires_at timestamp with time zone, 
  plan_name text, 
  status text, 
  can_create_study_hall boolean
)
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  subscription_record RECORD;
  current_halls bigint;
BEGIN
  -- Get current subscription
  SELECT ms.*, sp.name as plan_name, sp.max_study_halls as plan_max_halls
  INTO subscription_record
  FROM merchant_subscriptions ms
  LEFT JOIN subscription_plans sp ON ms.plan_id = sp.id
  WHERE ms.merchant_id = p_merchant_id
  AND ms.status IN ('active', 'trial')
  ORDER BY ms.created_at DESC
  LIMIT 1;
  
  -- Count current study halls
  SELECT COUNT(*) INTO current_halls
  FROM study_halls
  WHERE merchant_id = p_merchant_id
  AND status = 'active';
  
  -- If no subscription found, default to basic limits
  IF subscription_record IS NULL THEN
    RETURN QUERY SELECT 
      1::integer,
      current_halls,
      false::boolean,
      null::timestamp with time zone,
      'No Subscription'::text,
      'inactive'::text,
      false::boolean;
    RETURN;
  END IF;
  
  -- Determine max study halls (use plan limit or subscription override)
  DECLARE
    max_halls integer := COALESCE(subscription_record.max_study_halls, subscription_record.plan_max_halls, 1);
    is_trial_active boolean := subscription_record.is_trial AND (subscription_record.trial_end_date IS NULL OR subscription_record.trial_end_date > now());
    can_create boolean := current_halls < max_halls AND (NOT subscription_record.is_trial OR is_trial_active);
  BEGIN
    RETURN QUERY SELECT 
      max_halls,
      current_halls,
      subscription_record.is_trial,
      subscription_record.trial_end_date,
      subscription_record.plan_name,
      subscription_record.status,
      can_create;
  END;
END;
$$;