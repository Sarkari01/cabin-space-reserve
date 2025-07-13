-- Clean up database inconsistencies

-- First, fix the inconsistent booking (confirmed + unpaid should be pending + unpaid)
UPDATE bookings 
SET status = 'pending'
WHERE status = 'confirmed' AND payment_status = 'unpaid';

-- Update orphaned transactions that should be failed (online payments without bookings)
UPDATE transactions 
SET status = 'failed'
WHERE booking_id IS NULL 
  AND payment_method IN ('ekqr', 'razorpay') 
  AND status = 'pending';

-- Update orphaned offline transactions to failed (they should have been linked to bookings)
UPDATE transactions 
SET status = 'failed'
WHERE booking_id IS NULL 
  AND payment_method = 'offline' 
  AND status = 'pending';