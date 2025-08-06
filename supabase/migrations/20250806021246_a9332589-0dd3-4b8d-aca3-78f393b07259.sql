-- Fix cabin booking payment flow by updating functions and triggers

-- First, drop the problematic function that's causing foreign key violations
DROP FUNCTION IF EXISTS public.create_cabin_booking_transaction(uuid, numeric, text);

-- Create the correct function that uses cabin_booking_id instead of booking_id
CREATE OR REPLACE FUNCTION public.create_cabin_booking_transaction(
    p_cabin_booking_id uuid,
    p_amount numeric,
    p_payment_method text,
    p_payment_id text DEFAULT NULL,
    p_status text DEFAULT 'completed'
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
    v_transaction_id uuid;
    v_user_id uuid;
BEGIN
    -- Get user_id from cabin booking
    SELECT user_id INTO v_user_id
    FROM cabin_bookings
    WHERE id = p_cabin_booking_id;
    
    -- Create transaction record with cabin_booking_id
    INSERT INTO transactions (
        cabin_booking_id,
        user_id,
        amount,
        payment_method,
        payment_id,
        status
    ) VALUES (
        p_cabin_booking_id,
        v_user_id,
        p_amount,
        p_payment_method,
        p_payment_id,
        p_status
    ) RETURNING id INTO v_transaction_id;
    
    RETURN v_transaction_id;
END;
$function$;

-- Drop the existing trigger that's causing conflicts
DROP TRIGGER IF EXISTS handle_cabin_booking_payment_updates ON cabin_bookings;

-- Create a clean trigger function for cabin booking payments
CREATE OR REPLACE FUNCTION public.handle_cabin_booking_payment_updates()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
    -- When payment_status changes to 'paid', create transaction if it doesn't exist
    IF NEW.payment_status = 'paid' AND OLD.payment_status != 'paid' THEN
        -- Check if transaction already exists
        IF NOT EXISTS (
            SELECT 1 FROM transactions 
            WHERE cabin_booking_id = NEW.id
        ) THEN
            -- Create transaction record
            PERFORM public.create_cabin_booking_transaction(
                NEW.id,
                NEW.total_amount,
                'razorpay',
                NEW.razorpay_payment_id,
                'completed'
            );
        END IF;
        
        -- Update cabin status to occupied
        UPDATE cabins 
        SET status = 'occupied', updated_at = now()
        WHERE id = NEW.cabin_id;
        
        -- Update booking status to active
        NEW.status = 'active';
    END IF;
    
    RETURN NEW;
END;
$function$;

-- Create the trigger
CREATE TRIGGER handle_cabin_booking_payment_updates
    BEFORE UPDATE ON cabin_bookings
    FOR EACH ROW
    EXECUTE FUNCTION handle_cabin_booking_payment_updates();

-- Clean up any duplicate transactions that might exist
DELETE FROM transactions t1 
WHERE t1.cabin_booking_id IS NOT NULL 
AND EXISTS (
    SELECT 1 FROM transactions t2 
    WHERE t2.cabin_booking_id = t1.cabin_booking_id 
    AND t2.id > t1.id
);

-- Update any existing transactions that might have NULL cabin_booking_id but should have it
-- This handles edge cases from previous attempts
UPDATE transactions 
SET cabin_booking_id = (
    SELECT cb.id 
    FROM cabin_bookings cb 
    WHERE cb.razorpay_payment_id = transactions.payment_id
    AND transactions.cabin_booking_id IS NULL
    AND transactions.payment_method = 'razorpay'
)
WHERE cabin_booking_id IS NULL 
AND payment_method = 'razorpay'
AND EXISTS (
    SELECT 1 FROM cabin_bookings cb 
    WHERE cb.razorpay_payment_id = transactions.payment_id
);