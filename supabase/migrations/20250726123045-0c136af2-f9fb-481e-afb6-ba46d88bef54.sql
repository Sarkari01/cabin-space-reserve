-- Security Enhancement: Add search_path protection to all database functions
-- This prevents potential privilege escalation attacks

-- Update handle_booking_updates function
CREATE OR REPLACE FUNCTION public.handle_booking_updates()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = ''
AS $function$
BEGIN
  -- Log the booking update
  RAISE LOG 'Booking update detected: % -> %', OLD.status, NEW.status;
  
  -- If booking is confirmed, ensure seat is marked unavailable
  IF NEW.status = 'active' AND NEW.payment_status = 'paid' THEN
    UPDATE public.seats 
    SET is_available = false 
    WHERE id = NEW.seat_id AND is_available = true;
  END IF;
  
  -- If booking is cancelled, free up the seat
  IF NEW.status = 'cancelled' THEN
    UPDATE public.seats 
    SET is_available = true 
    WHERE id = NEW.seat_id AND is_available = false;
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Update handle_transaction_updates function
CREATE OR REPLACE FUNCTION public.handle_transaction_updates()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = ''
AS $function$
BEGIN
  -- Log the transaction update
  RAISE LOG 'Transaction update detected: % -> %', OLD.status, NEW.status;
  
  -- When transaction becomes completed, ensure booking is properly linked
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    -- Update associated booking payment status
    UPDATE public.bookings 
    SET payment_status = 'paid', 
        status = 'active',
        updated_at = now()
    WHERE id = NEW.booking_id;
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Update check_seat_availability function
CREATE OR REPLACE FUNCTION public.check_seat_availability(p_seat_id uuid, p_start_date date, p_end_date date)
 RETURNS boolean
 LANGUAGE plpgsql
 STABLE
 SECURITY DEFINER
 SET search_path = ''
AS $function$
BEGIN
  RETURN NOT EXISTS (
    SELECT 1 
    FROM public.bookings 
    WHERE seat_id = p_seat_id 
      AND status IN ('confirmed', 'active', 'pending')
      AND start_date <= p_end_date 
      AND end_date >= p_start_date
  );
END;
$function$;

-- Update generate_short_id function
CREATE OR REPLACE FUNCTION public.generate_short_id(table_name text, column_name text)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = ''
AS $function$
DECLARE
    new_id integer;
    max_attempts integer := 100;
    attempt_count integer := 0;
BEGIN
    LOOP
        -- Generate random 5-6 digit number (10000 to 999999)
        new_id := floor(random() * 990000 + 10000)::integer;
        
        -- Check if this ID already exists in the specified table
        EXECUTE format('SELECT 1 FROM %I WHERE %I = $1', table_name, column_name) 
        USING new_id;
        
        IF NOT FOUND THEN
            RETURN new_id;
        END IF;
        
        attempt_count := attempt_count + 1;
        IF attempt_count >= max_attempts THEN
            RAISE EXCEPTION 'Unable to generate unique 5-6 digit ID after % attempts', max_attempts;
        END IF;
    END LOOP;
END;
$function$;

-- Create secure is_admin function to prevent RLS recursion
CREATE OR REPLACE FUNCTION public.is_admin()
 RETURNS boolean
 LANGUAGE sql
 STABLE
 SECURITY DEFINER
 SET search_path = ''
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = auth.uid()
      AND role = 'admin'
  )
$function$;

-- Update auto_generate_booking_number function
CREATE OR REPLACE FUNCTION public.auto_generate_booking_number()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = ''
AS $function$
BEGIN
    IF NEW.booking_number IS NULL THEN
        NEW.booking_number := public.generate_short_id('bookings', 'booking_number');
    END IF;
    RETURN NEW;
END;
$function$;

-- Update auto_generate_transaction_number function
CREATE OR REPLACE FUNCTION public.auto_generate_transaction_number()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = ''
AS $function$
BEGIN
    IF NEW.transaction_number IS NULL THEN
        NEW.transaction_number := public.generate_short_id('transactions', 'transaction_number');
    END IF;
    RETURN NEW;
END;
$function$;

-- Update validate_review_eligibility function
CREATE OR REPLACE FUNCTION public.validate_review_eligibility()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = ''
AS $function$
BEGIN
  -- Check if booking exists and is completed
  IF NOT EXISTS (
    SELECT 1 FROM public.bookings 
    WHERE id = NEW.booking_id 
    AND user_id = NEW.user_id
    AND status = 'completed' 
    AND payment_status = 'paid'
  ) THEN
    RAISE EXCEPTION 'Can only review completed and paid bookings';
  END IF;
  
  -- Check if user hasn't already reviewed this study hall
  IF EXISTS (
    SELECT 1 FROM public.study_hall_reviews 
    WHERE user_id = NEW.user_id 
    AND study_hall_id = NEW.study_hall_id 
    AND id != COALESCE(NEW.id, gen_random_uuid())
  ) THEN
    RAISE EXCEPTION 'User has already reviewed this study hall';
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Add audit logging function for security events
CREATE OR REPLACE FUNCTION public.log_security_event(
  p_event_type text,
  p_user_id uuid,
  p_details jsonb DEFAULT '{}'::jsonb
)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = ''
AS $function$
BEGIN
  INSERT INTO public.security_audit_log (event_type, user_id, details, created_at)
  VALUES (p_event_type, p_user_id, p_details, now());
END;
$function$;

-- Create security audit log table
CREATE TABLE IF NOT EXISTS public.security_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type text NOT NULL,
  user_id uuid,
  details jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on security audit log
ALTER TABLE public.security_audit_log ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for security audit log (only admins can view)
CREATE POLICY "Only admins can view security audit log" 
ON public.security_audit_log 
FOR ALL 
TO authenticated 
USING (public.is_admin())
WITH CHECK (public.is_admin());