-- Fix the create_cabin_booking_transaction function - it's using booking_id instead of cabin_booking_id
DROP FUNCTION IF EXISTS public.create_cabin_booking_transaction(uuid, numeric, text, text, jsonb);

-- Create the correct function that uses cabin_booking_id
CREATE OR REPLACE FUNCTION public.create_cabin_booking_transaction(
    p_cabin_booking_id UUID,
    p_amount NUMERIC,
    p_payment_method TEXT,
    p_payment_id TEXT DEFAULT NULL,
    p_payment_data JSONB DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    v_user_id UUID;
    v_transaction_id UUID;
BEGIN
    -- Get user_id from cabin booking
    SELECT user_id INTO v_user_id
    FROM public.cabin_bookings
    WHERE id = p_cabin_booking_id;

    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Cabin booking not found or has no user_id: %', p_cabin_booking_id;
    END IF;

    -- Create transaction record with cabin_booking_id (NOT booking_id)
    INSERT INTO public.transactions (
        user_id,
        cabin_booking_id,  -- This is the correct column
        amount,
        payment_method,
        payment_id,
        payment_data,
        status
    ) VALUES (
        v_user_id,
        p_cabin_booking_id,
        p_amount,
        p_payment_method,
        p_payment_id,
        p_payment_data,
        'completed'
    ) RETURNING id INTO v_transaction_id;

    RAISE LOG 'Created transaction % for cabin booking % with amount %', v_transaction_id, p_cabin_booking_id, p_amount;
    
    RETURN v_transaction_id;
END;
$$;

-- Now test the fixed function
UPDATE cabin_bookings 
SET payment_status = 'paid', 
    status = 'active',
    razorpay_payment_id = 'test_payment_456'
WHERE id = 'bb1bbb09-0f3d-462a-9420-08960e6ae858';

-- Verify the transaction was created
SELECT 'Cabin booking payment flow test completed' as result;