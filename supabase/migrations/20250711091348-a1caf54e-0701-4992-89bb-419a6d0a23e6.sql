-- Create sample transaction data for testing

-- First, let's see if we have any existing data
-- We'll create some sample transactions for testing

INSERT INTO public.transactions (
  user_id,
  booking_id,
  amount,
  payment_method,
  payment_id,
  status,
  payment_data
)
SELECT 
  p.id as user_id,
  b.id as booking_id,
  b.total_amount,
  'razorpay' as payment_method,
  'pay_test_' || substr(md5(random()::text), 1, 10) as payment_id,
  'completed' as status,
  '{"transaction_id": "txn_test_123", "payment_method": "card"}' as payment_data
FROM profiles p
JOIN bookings b ON b.user_id = p.id
WHERE p.role = 'student'
LIMIT 3;

INSERT INTO public.transactions (
  user_id,
  booking_id,
  amount,
  payment_method,
  status,
  payment_data
)
SELECT 
  p.id as user_id,
  b.id as booking_id,
  b.total_amount,
  'ekqr' as payment_method,
  'pending' as status,
  '{"qr_code": "test_qr_123", "upi_id": "user@paytm"}' as payment_data
FROM profiles p
JOIN bookings b ON b.user_id = p.id
WHERE p.role = 'student'
LIMIT 2;

INSERT INTO public.transactions (
  user_id,
  booking_id,
  amount,
  payment_method,
  status,
  payment_data
)
SELECT 
  p.id as user_id,
  b.id as booking_id,
  b.total_amount,
  'offline' as payment_method,
  'pending' as status,
  '{"notes": "Pay at reception desk"}' as payment_data
FROM profiles p
JOIN bookings b ON b.user_id = p.id
WHERE p.role = 'student'
LIMIT 2;

-- Update business settings to enable all payment methods for testing
UPDATE public.business_settings 
SET 
  razorpay_enabled = true,
  razorpay_key_id = 'rzp_test_sample_key_123',
  ekqr_enabled = true,
  ekqr_merchant_id = 'merchant_test_456',
  offline_enabled = true
WHERE id = (SELECT id FROM public.business_settings LIMIT 1);