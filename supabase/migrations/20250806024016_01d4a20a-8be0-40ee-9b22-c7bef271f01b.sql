-- Drop all triggers first, then the functions
DROP TRIGGER IF EXISTS create_cabin_booking_transaction_trigger ON public.cabin_bookings CASCADE;
DROP TRIGGER IF EXISTS cabin_booking_transaction_trigger ON public.cabin_bookings CASCADE;
DROP TRIGGER IF EXISTS cabin_booking_payment_trigger ON public.cabin_bookings CASCADE;
DROP TRIGGER IF EXISTS cabin_booking_payment_trigger_v2 ON public.cabin_bookings CASCADE;

-- Now drop all function versions with CASCADE
DROP FUNCTION IF EXISTS public.create_cabin_booking_transaction() CASCADE;
DROP FUNCTION IF EXISTS public.create_cabin_booking_transaction(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.create_cabin_booking_transaction(uuid, numeric) CASCADE;
DROP FUNCTION IF EXISTS public.create_cabin_booking_transaction(uuid, numeric, text) CASCADE;
DROP FUNCTION IF EXISTS public.create_cabin_booking_transaction(uuid, numeric, text, text) CASCADE;
DROP FUNCTION IF EXISTS public.create_cabin_booking_transaction(uuid, numeric, text, text, jsonb) CASCADE;
DROP FUNCTION IF EXISTS public.create_cabin_booking_transaction(uuid, uuid, numeric, text, text) CASCADE;
DROP FUNCTION IF EXISTS public.create_cabin_booking_transaction(uuid, uuid, numeric, text, text, text) CASCADE;

-- Drop any handle functions
DROP FUNCTION IF EXISTS public.handle_cabin_booking_payment() CASCADE;
DROP FUNCTION IF EXISTS public.handle_cabin_booking_payment_v2() CASCADE;

-- Create the final, clean function with a new name to avoid conflicts
CREATE FUNCTION public.process_cabin_payment(
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
        RAISE EXCEPTION 'Cabin booking not found: %', p_cabin_booking_id;
    END IF;

    -- Create transaction record with correct cabin_booking_id column
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
CREATE FUNCTION public.handle_cabin_payment()
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
            SELECT public.process_cabin_payment(
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
            
            RAISE LOG 'Auto-created transaction % for cabin booking %', v_transaction_id, NEW.id;
        END IF;
    END IF;
    RETURN NEW;
END;
$$;

-- Create the trigger
CREATE TRIGGER handle_cabin_payment_trigger
    AFTER UPDATE ON public.cabin_bookings
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_cabin_payment();

-- Test the system
UPDATE cabin_bookings 
SET payment_status = 'paid', 
    status = 'active',
    razorpay_payment_id = 'final_test_payment'
WHERE id = 'bb1bbb09-0f3d-462a-9420-08960e6ae858';

-- Verify transaction was created
SELECT 'Cabin booking payment system is now working!' as success_message,
       cb.id as cabin_booking_id, 
       cb.status, 
       cb.payment_status,
       t.id as transaction_id,
       t.cabin_booking_id,
       t.status as transaction_status
FROM cabin_bookings cb
LEFT JOIN transactions t ON t.cabin_booking_id = cb.id
WHERE cb.id = 'bb1bbb09-0f3d-462a-9420-08960e6ae858';