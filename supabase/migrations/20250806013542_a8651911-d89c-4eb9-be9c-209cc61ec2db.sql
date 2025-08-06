-- Step 1: Fix user ID consistency for existing data
-- Get the current authenticated user ID and update mismatched records
DO $$
DECLARE
    current_user_uuid uuid;
BEGIN
    -- Get current user ID from auth context
    current_user_uuid := auth.uid();
    
    -- Only proceed if we have a valid user ID
    IF current_user_uuid IS NOT NULL THEN
        -- Update cabin bookings with mismatched user IDs
        UPDATE cabin_bookings 
        SET user_id = current_user_uuid
        WHERE user_id IS NOT NULL 
          AND user_id != current_user_uuid
          AND user_id::text LIKE '60c%'; -- Fix the specific ID mismatch
        
        -- Update transactions with mismatched user IDs  
        UPDATE transactions
        SET user_id = current_user_uuid
        WHERE user_id IS NOT NULL
          AND user_id != current_user_uuid
          AND user_id::text LIKE '60c%'; -- Fix the specific ID mismatch
          
        RAISE LOG 'Fixed user ID consistency for user %', current_user_uuid;
    END IF;
END $$;

-- Step 2: Create trigger function for automatic cabin booking transactions
CREATE OR REPLACE FUNCTION public.create_cabin_booking_transaction()
RETURNS TRIGGER AS $$
BEGIN
    -- Only create transaction when payment status becomes 'paid'
    IF NEW.payment_status = 'paid' AND (OLD.payment_status IS NULL OR OLD.payment_status != 'paid') THEN
        INSERT INTO public.transactions (
            booking_id,
            user_id,
            amount,
            payment_method,
            payment_id,
            status,
            payment_data
        ) VALUES (
            NEW.id,
            NEW.user_id,
            NEW.total_amount,
            'razorpay',
            NEW.razorpay_payment_id,
            'completed',
            jsonb_build_object(
                'booking_type', 'cabin',
                'razorpay_order_id', NEW.razorpay_order_id,
                'razorpay_payment_id', NEW.razorpay_payment_id,
                'cabin_id', NEW.cabin_id,
                'private_hall_id', NEW.private_hall_id,
                'months_booked', NEW.months_booked,
                'monthly_amount', NEW.monthly_amount
            )
        );
        
        RAISE LOG 'Created transaction for cabin booking %', NEW.id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 3: Create trigger for cabin booking transactions
DROP TRIGGER IF EXISTS cabin_booking_transaction_trigger ON cabin_bookings;
CREATE TRIGGER cabin_booking_transaction_trigger
    AFTER UPDATE ON cabin_bookings
    FOR EACH ROW
    EXECUTE FUNCTION public.create_cabin_booking_transaction();

-- Step 4: Create missing transaction records for existing paid cabin bookings
INSERT INTO public.transactions (
    booking_id,
    user_id,
    amount,
    payment_method,
    payment_id,
    status,
    payment_data,
    created_at,
    updated_at
)
SELECT 
    cb.id,
    cb.user_id,
    cb.total_amount,
    'razorpay',
    cb.razorpay_payment_id,
    'completed',
    jsonb_build_object(
        'booking_type', 'cabin',
        'razorpay_order_id', cb.razorpay_order_id,
        'razorpay_payment_id', cb.razorpay_payment_id,
        'cabin_id', cb.cabin_id,
        'private_hall_id', cb.private_hall_id,
        'months_booked', cb.months_booked,
        'monthly_amount', cb.monthly_amount
    ),
    cb.created_at,
    cb.updated_at
FROM cabin_bookings cb
WHERE cb.payment_status = 'paid'
  AND NOT EXISTS (
    SELECT 1 FROM transactions t 
    WHERE t.booking_id = cb.id
  );

-- Step 5: Ensure study hall transactions have booking_type in payment_data
UPDATE transactions 
SET payment_data = COALESCE(payment_data, '{}'::jsonb) || jsonb_build_object('booking_type', 'study_hall')
WHERE booking_id IN (
    SELECT b.id FROM bookings b 
    WHERE b.id = transactions.booking_id
)
AND (payment_data IS NULL OR payment_data->>'booking_type' IS NULL);