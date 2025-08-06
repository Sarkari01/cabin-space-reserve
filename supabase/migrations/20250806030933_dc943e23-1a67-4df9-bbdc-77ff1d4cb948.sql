-- Fix search path for the new functions to address security warnings
CREATE OR REPLACE FUNCTION public.create_cabin_booking_transaction()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
    -- Create transaction record for the cabin booking
    INSERT INTO public.transactions (
        cabin_booking_id,
        user_id,
        amount,
        payment_method,
        status
    ) VALUES (
        NEW.id,
        NEW.user_id,
        NEW.total_amount,
        'pending', -- Will be updated when actual payment method is known
        'pending'
    );
    
    RAISE LOG 'Created transaction for cabin booking %', NEW.id;
    RETURN NEW;
END;
$$;

-- Fix search path for update function
CREATE OR REPLACE FUNCTION public.update_cabin_booking_transaction_status()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
    -- Update corresponding transaction status when cabin booking payment status changes
    IF NEW.payment_status != OLD.payment_status THEN
        UPDATE public.transactions 
        SET 
            status = CASE 
                WHEN NEW.payment_status = 'paid' THEN 'completed'
                WHEN NEW.payment_status = 'failed' THEN 'failed'
                ELSE 'pending'
            END,
            updated_at = now()
        WHERE cabin_booking_id = NEW.id;
        
        RAISE LOG 'Updated transaction status for cabin booking % to %', NEW.id, NEW.payment_status;
    END IF;
    
    RETURN NEW;
END;
$$;