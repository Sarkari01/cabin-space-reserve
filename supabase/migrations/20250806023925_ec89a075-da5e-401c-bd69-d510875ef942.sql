-- Remove ALL versions of these functions by dropping all possible signatures
DO $$
DECLARE
    func_signature TEXT;
BEGIN
    -- Get all function signatures for create_cabin_booking_transaction
    FOR func_signature IN 
        SELECT pg_proc.oid::regprocedure::text 
        FROM pg_proc 
        WHERE proname = 'create_cabin_booking_transaction'
    LOOP
        EXECUTE 'DROP FUNCTION IF EXISTS ' || func_signature;
        RAISE LOG 'Dropped function: %', func_signature;
    END LOOP;
    
    -- Get all function signatures for handle_cabin_booking_payment
    FOR func_signature IN 
        SELECT pg_proc.oid::regprocedure::text 
        FROM pg_proc 
        WHERE proname LIKE '%handle_cabin_booking_payment%'
    LOOP
        EXECUTE 'DROP FUNCTION IF EXISTS ' || func_signature;
        RAISE LOG 'Dropped function: %', func_signature;
    END LOOP;
END $$;

-- Remove all triggers on cabin_bookings table
DROP TRIGGER IF EXISTS cabin_booking_payment_trigger ON public.cabin_bookings;
DROP TRIGGER IF EXISTS cabin_booking_payment_trigger_v2 ON public.cabin_bookings;

-- Now create the clean, correct function
CREATE FUNCTION public.create_cabin_transaction(
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
    SELECT user_id INTO v_user_id
    FROM public.cabin_bookings
    WHERE id = p_cabin_booking_id;

    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Cabin booking not found: %', p_cabin_booking_id;
    END IF;

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

    RAISE LOG 'Created transaction % for cabin booking %', v_transaction_id, p_cabin_booking_id;
    RETURN v_transaction_id;
END;
$$;

-- Create clean trigger function
CREATE FUNCTION public.cabin_payment_trigger()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    v_transaction_id UUID;
BEGIN
    IF NEW.payment_status = 'paid' AND (OLD.payment_status IS NULL OR OLD.payment_status != 'paid') THEN
        IF NOT EXISTS (SELECT 1 FROM public.transactions WHERE cabin_booking_id = NEW.id) THEN
            SELECT public.create_cabin_transaction(
                NEW.id,
                NEW.total_amount,
                'razorpay',
                NEW.razorpay_payment_id,
                jsonb_build_object('booking_type', 'cabin', 'razorpay_order_id', NEW.razorpay_order_id)
            ) INTO v_transaction_id;
        END IF;
    END IF;
    RETURN NEW;
END;
$$;

-- Create the trigger
CREATE TRIGGER cabin_payment_trigger
    AFTER UPDATE ON public.cabin_bookings
    FOR EACH ROW
    EXECUTE FUNCTION public.cabin_payment_trigger();

SELECT 'Clean setup completed' as result;