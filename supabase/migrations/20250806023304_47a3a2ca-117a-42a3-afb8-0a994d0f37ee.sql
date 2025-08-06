-- Fix the trigger function that's still using booking_id instead of cabin_booking_id
CREATE OR REPLACE FUNCTION public.handle_cabin_booking_payment()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
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
            -- Create transaction record using the FIXED function
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

-- Now test the fixed flow
UPDATE cabin_bookings 
SET payment_status = 'paid', 
    status = 'active',
    razorpay_payment_id = 'test_payment_789'
WHERE id = 'bb1bbb09-0f3d-462a-9420-08960e6ae858';

-- Verify the transaction was created correctly
SELECT cb.id as cabin_booking_id, cb.status, cb.payment_status, 
       t.id as transaction_id, t.cabin_booking_id, t.status as transaction_status
FROM cabin_bookings cb
LEFT JOIN transactions t ON t.cabin_booking_id = cb.id
WHERE cb.id = 'bb1bbb09-0f3d-462a-9420-08960e6ae858';