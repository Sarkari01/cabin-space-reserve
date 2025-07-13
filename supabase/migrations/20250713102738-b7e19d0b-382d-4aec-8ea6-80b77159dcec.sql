-- Fix cancelled bookings that should be confirmed
-- Update the specific transaction that was stuck in pending status
UPDATE transactions 
SET status = 'completed', 
    updated_at = now()
WHERE id = '9bac60a2-798b-4406-80e7-5ee289c73af4' 
AND status = 'pending';

-- Fix any cancelled bookings that have corresponding completed transactions
-- These bookings were likely cancelled due to failed status checks, but payment was actually successful
UPDATE bookings 
SET status = 'confirmed', 
    payment_status = 'paid',
    updated_at = now()
WHERE status = 'cancelled' 
AND payment_status = 'unpaid'
AND id IN (
    SELECT b.id 
    FROM bookings b
    INNER JOIN transactions t ON t.booking_id = b.id
    WHERE t.status = 'completed' 
    AND t.payment_method IN ('ekqr', 'razorpay')
    AND b.status = 'cancelled'
);

-- Log the changes
DO $$
DECLARE
    updated_txns INTEGER;
    updated_bookings INTEGER;
BEGIN
    GET DIAGNOSTICS updated_txns = ROW_COUNT;
    
    UPDATE bookings 
    SET status = 'confirmed', 
        payment_status = 'paid',
        updated_at = now()
    WHERE status = 'cancelled' 
    AND payment_status = 'unpaid'
    AND id IN (
        SELECT b.id 
        FROM bookings b
        INNER JOIN transactions t ON t.booking_id = b.id
        WHERE t.status = 'completed' 
        AND t.payment_method IN ('ekqr', 'razorpay')
        AND b.status = 'cancelled'
    );
    
    GET DIAGNOSTICS updated_bookings = ROW_COUNT;
    
    RAISE NOTICE 'Fixed % transaction(s) and % booking(s)', updated_txns, updated_bookings;
END $$;