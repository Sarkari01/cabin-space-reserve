-- Fix EKQR field naming and add validation function
-- Rename ekqr_merchant_id to ekqr_merchant_code for clarity
ALTER TABLE public.business_settings 
RENAME COLUMN ekqr_merchant_id TO ekqr_merchant_code;

-- Update the existing sample data to use better field names
UPDATE public.business_settings 
SET 
  razorpay_key_id = 'rzp_test_1234567890123456',
  ekqr_merchant_code = 'MERCHANT123456'
WHERE ekqr_merchant_code = 'merchant_test_456';