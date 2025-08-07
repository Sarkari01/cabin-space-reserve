-- Fix cabin booking payment trigger to use process_cabin_payment function
-- This ensures deposit amounts are properly stored in transactions

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS create_cabin_booking_transaction ON public.cabin_bookings;
DROP FUNCTION IF EXISTS public.create_cabin_booking_transaction();

-- Create proper trigger that calls process_cabin_payment for proper deposit handling
CREATE OR REPLACE FUNCTION public.handle_cabin_payment_completion()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_transaction_id uuid;
BEGIN
    -- Only create transaction when booking becomes paid for the first time
    IF NEW.payment_status = 'paid' AND (OLD.payment_status != 'paid' OR OLD.payment_status IS NULL) THEN
        -- Call process_cabin_payment to create transaction with proper deposit breakdown
        SELECT process_cabin_payment(
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
        
        RAISE LOG 'Created transaction % for cabin booking % with proper deposit breakdown', 
            v_transaction_id, NEW.id;
    END IF;
    
    RETURN NEW;
END;
$$;

-- Create the trigger
CREATE TRIGGER handle_cabin_payment_completion
    AFTER UPDATE ON public.cabin_bookings
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_cabin_payment_completion();

-- Backfill existing transactions with proper deposit amounts
-- This fixes all existing transactions that have 0.00 for booking_amount and deposit_amount
UPDATE public.transactions t
SET 
    booking_amount = COALESCE(cb.booking_amount, cb.monthly_amount * cb.months_booked),
    deposit_amount = COALESCE(cb.deposit_amount, 0)
FROM public.cabin_bookings cb
WHERE t.cabin_booking_id = cb.id
    AND t.cabin_booking_id IS NOT NULL
    AND (t.booking_amount = 0 OR t.deposit_amount = 0 OR t.booking_amount IS NULL OR t.deposit_amount IS NULL);

-- Log the backfill results
DO $$
DECLARE
    updated_count integer;
BEGIN
    GET DIAGNOSTICS updated_count = ROW_COUNT;
    RAISE LOG 'Backfilled deposit amounts for % existing transactions', updated_count;
END $$;