-- Add Razorpay support to business settings
ALTER TABLE public.business_settings 
ADD COLUMN razorpay_enabled boolean NOT NULL DEFAULT false;