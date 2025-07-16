-- Create function to automatically activate trial when merchant is approved
CREATE OR REPLACE FUNCTION public.auto_activate_trial_on_approval()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  trial_settings RECORD;
  activation_result JSONB;
BEGIN
  -- Only proceed if status changed to 'approved' and was not already approved
  IF NEW.verification_status = 'approved' AND OLD.verification_status != 'approved' THEN
    
    -- Get trial settings to check if auto-activation is enabled
    SELECT * INTO trial_settings FROM get_trial_plan_settings();
    
    -- Check if trial plan is enabled
    IF trial_settings.enabled THEN
      
      -- Check if merchant has not used trial before
      IF NOT has_merchant_used_trial(NEW.merchant_id) THEN
        
        -- Activate trial subscription
        SELECT activate_trial_subscription(NEW.merchant_id) INTO activation_result;
        
        -- Log the activation attempt
        INSERT INTO public.trial_activation_logs (
          merchant_id,
          activation_type,
          success,
          details,
          activated_by
        ) VALUES (
          NEW.merchant_id,
          'auto_on_approval',
          (activation_result->>'success')::boolean,
          activation_result,
          'system'
        );
        
        -- Create notification for merchant if successful
        IF (activation_result->>'success')::boolean THEN
          INSERT INTO public.notifications (
            user_id,
            title,
            message,
            type,
            action_url
          ) VALUES (
            NEW.merchant_id,
            'Welcome! Your Free Trial is Active',
            'Congratulations! Your merchant account has been approved and your ' || trial_settings.plan_name || ' is now active. Start creating your study halls today!',
            'success',
            '/merchant/dashboard'
          );
          
          RAISE LOG 'Auto-activated trial for merchant % on approval', NEW.merchant_id;
        ELSE
          RAISE LOG 'Failed to auto-activate trial for merchant %: %', NEW.merchant_id, activation_result->>'error';
        END IF;
        
      ELSE
        -- Log that merchant already used trial
        INSERT INTO public.trial_activation_logs (
          merchant_id,
          activation_type,
          success,
          details,
          activated_by
        ) VALUES (
          NEW.merchant_id,
          'auto_on_approval',
          false,
          jsonb_build_object('error', 'Merchant has already used trial'),
          'system'
        );
      END IF;
      
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trial activation logs table for audit trail
CREATE TABLE IF NOT EXISTS public.trial_activation_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id UUID NOT NULL REFERENCES public.profiles(id),
  activation_type TEXT NOT NULL, -- 'manual', 'auto_on_approval'
  success BOOLEAN NOT NULL DEFAULT false,
  details JSONB,
  activated_by TEXT, -- 'system', admin_user_id, or merchant_id
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on trial activation logs
ALTER TABLE public.trial_activation_logs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for trial activation logs
CREATE POLICY "Admins can view all trial activation logs"
ON public.trial_activation_logs
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Merchants can view their own trial activation logs"
ON public.trial_activation_logs
FOR SELECT
TO authenticated
USING (merchant_id = auth.uid());

CREATE POLICY "System can create trial activation logs"
ON public.trial_activation_logs
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Create trigger to auto-activate trial on merchant approval
CREATE TRIGGER trigger_auto_trial_on_approval
  AFTER UPDATE OF verification_status ON public.merchant_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_activate_trial_on_approval();