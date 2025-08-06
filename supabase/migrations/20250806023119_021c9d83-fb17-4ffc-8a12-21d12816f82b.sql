-- Test the cabin booking payment flow by updating the existing booking
UPDATE cabin_bookings 
SET payment_status = 'paid', 
    status = 'active',
    razorpay_payment_id = 'test_payment_123'
WHERE id = 'bb1bbb09-0f3d-462a-9420-08960e6ae858';

-- Check if the trigger created a transaction
SELECT 'Testing cabin booking payment trigger' as test_description;