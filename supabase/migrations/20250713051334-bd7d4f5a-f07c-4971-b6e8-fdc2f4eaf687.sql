-- Clean up inconsistent booking and transaction data after payment flow fixes

-- 1. Update bookings that are confirmed but unpaid from successful online payments to have proper status
UPDATE bookings 
SET payment_status = 'paid' 
WHERE status = 'confirmed' 
  AND payment_status = 'unpaid'
  AND id IN (
    SELECT DISTINCT b.id 
    FROM bookings b 
    JOIN transactions t ON t.booking_id = b.id 
    WHERE t.status = 'completed' 
      AND t.payment_method IN ('ekqr', 'razorpay')
  );

-- 2. Update transactions that should be linked to their bookings
UPDATE transactions 
SET booking_id = (
  SELECT b.id 
  FROM bookings b 
  WHERE b.user_id = transactions.user_id
    AND b.total_amount = transactions.amount
    AND b.created_at >= transactions.created_at - INTERVAL '1 hour'
    AND b.created_at <= transactions.created_at + INTERVAL '1 hour'
  ORDER BY ABS(EXTRACT(EPOCH FROM (b.created_at - transactions.created_at)))
  LIMIT 1
)
WHERE booking_id IS NULL 
  AND status = 'completed'
  AND payment_method IN ('ekqr', 'razorpay')
  AND EXISTS (
    SELECT 1 FROM bookings b 
    WHERE b.user_id = transactions.user_id
      AND b.total_amount = transactions.amount
      AND b.created_at >= transactions.created_at - INTERVAL '1 hour'
      AND b.created_at <= transactions.created_at + INTERVAL '1 hour'
  );

-- 3. Mark orphaned online transactions as failed (no corresponding booking within reasonable time)
UPDATE transactions 
SET status = 'failed'
WHERE booking_id IS NULL 
  AND status = 'pending'
  AND payment_method IN ('ekqr', 'razorpay')
  AND created_at < NOW() - INTERVAL '1 hour';

-- 4. For offline transactions without bookings, create pending bookings if possible
-- Note: This is complex and would require additional booking intent data
-- For now, we'll just mark old orphaned offline transactions as cancelled
UPDATE transactions 
SET status = 'cancelled'
WHERE booking_id IS NULL 
  AND status = 'pending'
  AND payment_method = 'offline'
  AND created_at < NOW() - INTERVAL '24 hours';