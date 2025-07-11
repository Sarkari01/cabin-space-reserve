-- Create default business settings if none exist
INSERT INTO public.business_settings (
  razorpay_enabled,
  razorpay_key_id,
  ekqr_enabled,
  ekqr_merchant_id,
  offline_enabled
)
SELECT false, null, false, null, true
WHERE NOT EXISTS (SELECT 1 FROM public.business_settings);

-- Update existing business_settings to ensure offline is enabled by default
UPDATE public.business_settings 
SET offline_enabled = true 
WHERE offline_enabled IS NULL;