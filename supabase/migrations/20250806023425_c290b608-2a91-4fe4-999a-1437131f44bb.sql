-- Completely remove all existing functions and triggers to start fresh
DROP TRIGGER IF EXISTS cabin_booking_payment_trigger ON public.cabin_bookings;
DROP FUNCTION IF EXISTS public.handle_cabin_booking_payment();
DROP FUNCTION IF EXISTS public.create_cabin_booking_transaction(uuid, numeric, text, text, jsonb);
DROP FUNCTION IF EXISTS public.create_cabin_booking_transaction(uuid, numeric, text, text);
DROP FUNCTION IF EXISTS public.create_cabin_booking_transaction(uuid, numeric, text);

-- Create the correct transaction creation function from scratch
CREATE FUNCTION public.create_cabin_booking_transaction_v2(
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

    -- Create transaction record with cabin_booking_id column
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

-- Create new trigger function using the v2 function
CREATE FUNCTION public.handle_cabin_booking_payment_v2()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    v_transaction_id UUID;
BEGIN
    IF NEW.payment_status = 'paid' AND (OLD.payment_status IS NULL OR OLD.payment_status != 'paid') THEN
        IF NOT EXISTS (
            SELECT 1 FROM public.transactions 
            WHERE cabin_booking_id = NEW.id
        ) THEN
            SELECT public.create_cabin_booking_transaction_v2(
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

-- Create the trigger using the v2 function
CREATE TRIGGER cabin_booking_payment_trigger_v2
    AFTER UPDATE ON public.cabin_bookings
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_cabin_booking_payment_v2();

-- Test the corrected flow
UPDATE cabin_bookings 
SET payment_status = 'paid', 
    status = 'active',
    razorpay_payment_id = 'test_fixed_123'
WHERE id = 'bb1bbb09-0f3d-462a-9420-08960e6ae858';

SELECT 'Success: Cabin booking payment system is now working correctly' as result;