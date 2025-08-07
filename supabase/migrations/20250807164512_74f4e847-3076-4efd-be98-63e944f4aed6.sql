-- Update the cabin payment processing function to handle deposit amounts properly
CREATE OR REPLACE FUNCTION public.process_cabin_payment(
    p_cabin_booking_id uuid,
    p_total_amount numeric,
    p_payment_method text DEFAULT 'razorpay',
    p_payment_id text DEFAULT NULL,
    p_payment_data jsonb DEFAULT NULL
) 
RETURNS uuid 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    v_transaction_id uuid;
    v_user_id uuid;
    v_booking_amount numeric;
    v_deposit_amount numeric;
BEGIN
    -- Get booking details including deposit breakdown
    SELECT 
        user_id, 
        booking_amount, 
        deposit_amount
    INTO v_user_id, v_booking_amount, v_deposit_amount
    FROM cabin_bookings
    WHERE id = p_cabin_booking_id;
    
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Cabin booking not found: %', p_cabin_booking_id;
    END IF;
    
    -- Create transaction record with proper deposit tracking
    INSERT INTO transactions (
        cabin_booking_id,
        user_id,
        amount,
        booking_amount,
        deposit_amount,
        payment_method,
        payment_id,
        status,
        payment_data
    ) VALUES (
        p_cabin_booking_id,
        v_user_id,
        p_total_amount,
        COALESCE(v_booking_amount, p_total_amount),
        COALESCE(v_deposit_amount, 0),
        p_payment_method,
        p_payment_id,
        'completed',
        COALESCE(p_payment_data, jsonb_build_object('booking_type', 'cabin'))
    ) RETURNING id INTO v_transaction_id;
    
    RAISE LOG 'Created transaction % for cabin booking % with total: %, booking: %, deposit: %', 
        v_transaction_id, p_cabin_booking_id, p_total_amount, v_booking_amount, v_deposit_amount;
    
    RETURN v_transaction_id;
END;
$$;