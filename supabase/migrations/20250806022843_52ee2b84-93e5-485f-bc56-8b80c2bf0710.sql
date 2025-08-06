-- Fix cabin booking payments by cleaning up functions and adding proper triggers

-- Step 1: Drop any existing cabin booking transaction functions to clean up duplicates
DROP FUNCTION IF EXISTS public.create_cabin_booking_transaction(uuid, numeric, text, text, jsonb);
DROP FUNCTION IF EXISTS public.create_cabin_booking_transaction(uuid, numeric, text, text);
DROP FUNCTION IF EXISTS public.create_cabin_booking_transaction(uuid, numeric, text);

-- Step 2: Create the correct cabin booking transaction function
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

    -- Create transaction record with cabin_booking_id (not booking_id)
    INSERT INTO public.transactions (
        user_id,
        cabin_booking_id,
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

-- Step 3: Create trigger function to automatically create transactions when cabin bookings are paid
CREATE OR REPLACE FUNCTION public.handle_cabin_booking_payment()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_transaction_id UUID;
BEGIN
    -- When payment_status changes to 'paid', create transaction if it doesn't exist
    IF NEW.payment_status = 'paid' AND (OLD.payment_status IS NULL OR OLD.payment_status != 'paid') THEN
        -- Check if transaction already exists for this cabin booking
        IF NOT EXISTS (
            SELECT 1 FROM public.transactions 
            WHERE cabin_booking_id = NEW.id
        ) THEN
            -- Create transaction record
            SELECT public.create_cabin_booking_transaction(
                NEW.id,
                NEW.total_amount,
                'razorpay',
                NEW.razorpay_payment_id,
                jsonb_build_object(
                    'booking_type', 'cabin',
                    'razorpay_order_id', NEW.razorpay_order_id,
                    'razorpay_payment_id', NEW.razorpay_payment_id
                )
            ) INTO v_transaction_id;
            
            RAISE LOG 'Auto-created transaction % for paid cabin booking %', v_transaction_id, NEW.id;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$;

-- Step 4: Create the trigger on cabin_bookings table
DROP TRIGGER IF EXISTS cabin_booking_payment_trigger ON public.cabin_bookings;
CREATE TRIGGER cabin_booking_payment_trigger
    AFTER UPDATE ON public.cabin_bookings
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_cabin_booking_payment();

-- Step 5: Fix any existing paid cabin bookings that don't have transactions
INSERT INTO public.transactions (
    user_id,
    cabin_booking_id,
    amount,
    payment_method,
    payment_id,
    payment_data,
    status,
    created_at,
    updated_at
)
SELECT 
    cb.user_id,
    cb.id,
    cb.total_amount,
    'razorpay',
    cb.razorpay_payment_id,
    jsonb_build_object(
        'booking_type', 'cabin',
        'razorpay_order_id', cb.razorpay_order_id,
        'razorpay_payment_id', cb.razorpay_payment_id
    ),
    'completed',
    cb.updated_at,
    cb.updated_at
FROM public.cabin_bookings cb
WHERE cb.payment_status = 'paid'
  AND cb.user_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.transactions t 
    WHERE t.cabin_booking_id = cb.id
  );

-- Log completion
SELECT 'Cabin booking payment system fixed successfully' as result;