-- Enable cron extension for scheduled tasks
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Create a function to automatically recover pending EKQR payments
CREATE OR REPLACE FUNCTION auto_recover_pending_ekqr_payments()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  RAISE LOG 'Starting automatic EKQR payment recovery';
  
  -- Call the auto-ekqr-recovery edge function
  PERFORM net.http_post(
    url := 'https://jseyxxsptcckjumjcljk.supabase.co/functions/v1/auto-ekqr-recovery',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer ' || current_setting('app.supabase_service_role_key') || '"}'::jsonb,
    body := '{}'::jsonb
  );
  
  RAISE LOG 'Automatic EKQR payment recovery completed';
END;
$$;

-- Schedule the function to run every 2 minutes (faster recovery)
SELECT cron.schedule(
  'auto-ekqr-recovery',
  '*/2 * * * *', -- Every 2 minutes
  'SELECT auto_recover_pending_ekqr_payments();'
);

-- Create a function to clean up old failed transactions (run daily)
CREATE OR REPLACE FUNCTION cleanup_old_failed_transactions()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  -- Mark transactions older than 24 hours that are still pending as failed
  UPDATE transactions 
  SET status = 'failed', 
      payment_data = COALESCE(payment_data, '{}'::jsonb) || jsonb_build_object(
        'auto_cleanup_reason', 'Transaction expired after 24 hours',
        'auto_cleanup_at', NOW()
      )
  WHERE status = 'pending' 
    AND payment_method = 'ekqr'
    AND created_at < NOW() - INTERVAL '24 hours';
    
  RAISE LOG 'Cleaned up old pending EKQR transactions';
END;
$$;

-- Schedule cleanup to run daily at 2 AM
SELECT cron.schedule(
  'cleanup-old-ekqr-transactions',
  '0 2 * * *', -- Daily at 2 AM
  'SELECT cleanup_old_failed_transactions();'
);

-- Create improved booking creation trigger to handle edge cases
CREATE OR REPLACE FUNCTION improved_handle_booking_updates()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  -- Log the booking update
  RAISE LOG 'Booking update detected: % -> %', OLD.status, NEW.status;
  
  -- If booking is confirmed/active, ensure seat is marked unavailable
  IF NEW.status IN ('active', 'confirmed') AND NEW.payment_status = 'paid' THEN
    UPDATE public.seats 
    SET is_available = false 
    WHERE id = NEW.seat_id AND is_available = true;
    
    RAISE LOG 'Seat % marked as unavailable for booking %', NEW.seat_id, NEW.id;
  END IF;
  
  -- If booking is cancelled, free up the seat
  IF NEW.status = 'cancelled' THEN
    UPDATE public.seats 
    SET is_available = true 
    WHERE id = NEW.seat_id AND is_available = false;
    
    RAISE LOG 'Seat % freed up from cancelled booking %', NEW.seat_id, NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Drop old trigger and create new one
DROP TRIGGER IF EXISTS handle_booking_updates ON bookings;
CREATE TRIGGER handle_booking_updates
  AFTER UPDATE ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION improved_handle_booking_updates();

-- Create improved transaction update trigger
CREATE OR REPLACE FUNCTION improved_handle_transaction_updates()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  -- Log the transaction update
  RAISE LOG 'Transaction update detected: % -> % for payment method %', OLD.status, NEW.status, NEW.payment_method;
  
  -- When transaction becomes completed, ensure booking is properly linked
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    -- Update associated booking payment status and activation
    UPDATE public.bookings 
    SET payment_status = 'paid', 
        status = CASE 
          WHEN status = 'pending' THEN 'confirmed'
          ELSE status 
        END,
        updated_at = now()
    WHERE id = NEW.booking_id;
    
    RAISE LOG 'Updated booking % for completed transaction %', NEW.booking_id, NEW.id;
  END IF;
  
  -- If transaction failed, consider cleaning up any associated pending booking
  IF NEW.status = 'failed' AND OLD.status != 'failed' THEN
    -- Cancel any pending bookings associated with failed transactions
    UPDATE public.bookings 
    SET status = 'cancelled',
        updated_at = now()
    WHERE id = NEW.booking_id 
      AND status = 'pending' 
      AND payment_status = 'unpaid';
      
    RAISE LOG 'Cancelled pending booking % for failed transaction %', NEW.booking_id, NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Drop old trigger and create new one
DROP TRIGGER IF EXISTS handle_transaction_updates ON transactions;
CREATE TRIGGER handle_transaction_updates
  AFTER UPDATE ON transactions
  FOR EACH ROW
  EXECUTE FUNCTION improved_handle_transaction_updates();