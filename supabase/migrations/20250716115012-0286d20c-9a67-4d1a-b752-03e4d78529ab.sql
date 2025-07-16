-- Add API key preview fields to business_settings table
ALTER TABLE public.business_settings 
ADD COLUMN google_maps_api_key_preview text,
ADD COLUMN razorpay_key_id_preview text,
ADD COLUMN razorpay_key_secret_preview text,
ADD COLUMN ekqr_api_key_preview text;

-- Add comments for documentation
COMMENT ON COLUMN public.business_settings.google_maps_api_key_preview IS 'Masked preview of Google Maps API key for UI display';
COMMENT ON COLUMN public.business_settings.razorpay_key_id_preview IS 'Masked preview of Razorpay key ID for UI display';
COMMENT ON COLUMN public.business_settings.razorpay_key_secret_preview IS 'Masked preview of Razorpay secret key for UI display';
COMMENT ON COLUMN public.business_settings.ekqr_api_key_preview IS 'Masked preview of EKQR API key for UI display';