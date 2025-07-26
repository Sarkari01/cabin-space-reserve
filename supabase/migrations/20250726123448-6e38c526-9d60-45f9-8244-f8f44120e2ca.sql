-- Final batch: Fix remaining database functions with security definer and search_path
-- Part 3: Complete security enhancements for all remaining functions

-- Update cleanup_old_failed_transactions function
CREATE OR REPLACE FUNCTION public.cleanup_old_failed_transactions()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = ''
AS $function$
BEGIN
  -- Mark transactions older than 24 hours that are still pending as failed
  UPDATE public.transactions 
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
$function$;

-- Update improved_handle_booking_updates function
CREATE OR REPLACE FUNCTION public.improved_handle_booking_updates()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = ''
AS $function$
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
$function$;

-- Update auto_publish_scheduled_news function
CREATE OR REPLACE FUNCTION public.auto_publish_scheduled_news()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = ''
AS $function$
BEGIN
  -- Update scheduled posts whose time has come to be published
  UPDATE public.news_posts 
  SET status = 'active',
      updated_at = now()
  WHERE status = 'scheduled' 
    AND scheduled_at IS NOT NULL 
    AND scheduled_at <= now();
    
  RAISE LOG 'Auto-published scheduled news posts';
END;
$function$;

-- Update calculate_total_seats_from_config function
CREATE OR REPLACE FUNCTION public.calculate_total_seats_from_config(row_seat_config jsonb)
 RETURNS integer
 LANGUAGE plpgsql
 IMMUTABLE
 SECURITY DEFINER
 SET search_path = ''
AS $function$
DECLARE
  total INTEGER := 0;
  row_config JSONB;
BEGIN
  FOR row_config IN SELECT value FROM jsonb_each(row_seat_config)
  LOOP
    total := total + (row_config->>'seats')::INTEGER;
  END LOOP;
  
  RETURN total;
END;
$function$;

-- Update get_available_seats function
CREATE OR REPLACE FUNCTION public.get_available_seats(p_study_hall_id uuid, p_start_date date, p_end_date date)
 RETURNS TABLE(seat_id uuid, seat_identifier text, row_name text, seat_number integer)
 LANGUAGE plpgsql
 STABLE
 SECURITY DEFINER
 SET search_path = ''
AS $function$
BEGIN
  RETURN QUERY
  SELECT s.id, s.seat_id, s.row_name, s.seat_number
  FROM public.seats s
  WHERE s.study_hall_id = p_study_hall_id
    AND s.is_available = true
    AND NOT EXISTS (
      SELECT 1 
      FROM public.bookings b 
      WHERE b.seat_id = s.id 
        AND b.status IN ('confirmed', 'active', 'pending')
        AND b.start_date <= p_end_date 
        AND b.end_date >= p_start_date
    )
  ORDER BY s.row_name, s.seat_number;
END;
$function$;

-- Update improved_handle_transaction_updates function
CREATE OR REPLACE FUNCTION public.improved_handle_transaction_updates()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = ''
AS $function$
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
$function$;

-- Update auto_recover_pending_ekqr_payments function
CREATE OR REPLACE FUNCTION public.auto_recover_pending_ekqr_payments()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = ''
AS $function$
BEGIN
  RAISE LOG 'Starting automatic EKQR payment recovery';
  
  -- Call the auto-ekqr-recovery edge function with proper headers
  PERFORM net.http_post(
    url := 'https://jseyxxsptcckjumjcljk.supabase.co/functions/v1/auto-ekqr-recovery',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.supabase_service_role_key', true)
    ),
    body := jsonb_build_object()
  );
  
  RAISE LOG 'Automatic EKQR payment recovery completed';
EXCEPTION
  WHEN OTHERS THEN
    RAISE LOG 'Error in auto_recover_pending_ekqr_payments: %', SQLERRM;
END;
$function$;