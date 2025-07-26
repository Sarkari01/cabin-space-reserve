-- Continue fixing remaining database functions with security definer and search_path
-- Part 2: Update remaining functions to add security protections

-- Update auto_generate_hall_number function
CREATE OR REPLACE FUNCTION public.auto_generate_hall_number()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = ''
AS $function$
BEGIN
    IF NEW.hall_number IS NULL THEN
        NEW.hall_number := public.generate_short_id('study_halls', 'hall_number');
    END IF;
    RETURN NEW;
END;
$function$;

-- Update auto_generate_merchant_number function
CREATE OR REPLACE FUNCTION public.auto_generate_merchant_number()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = ''
AS $function$
BEGIN
    IF NEW.merchant_number IS NULL AND NEW.role = 'merchant' THEN
        NEW.merchant_number := public.generate_short_id('profiles', 'merchant_number');
    END IF;
    RETURN NEW;
END;
$function$;

-- Update auto_generate_student_number function
CREATE OR REPLACE FUNCTION public.auto_generate_student_number()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = ''
AS $function$
BEGIN
    IF NEW.student_number IS NULL AND NEW.role = 'student' THEN
        NEW.student_number := public.generate_short_id('profiles', 'student_number');
    END IF;
    RETURN NEW;
END;
$function$;

-- Update set_news_creator function
CREATE OR REPLACE FUNCTION public.set_news_creator()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = ''
AS $function$
DECLARE
  user_role text;
BEGIN
  -- Get the user's role
  SELECT role INTO user_role
  FROM public.profiles
  WHERE id = auth.uid();
  
  -- Set creator fields based on user role and institution context
  NEW.created_by := auth.uid();
  
  -- If institution_id is provided, prioritize institution type regardless of creator role
  IF NEW.institution_id IS NOT NULL THEN
    NEW.created_by_type := 'institution'::creator_type;
  ELSE
    -- Use user role for type when no institution is specified
    CASE user_role
      WHEN 'admin' THEN
        NEW.created_by_type := 'admin'::creator_type;
      WHEN 'institution' THEN
        NEW.created_by_type := 'institution'::creator_type;
      WHEN 'telemarketing_executive' THEN
        NEW.created_by_type := 'telemarketing_executive'::creator_type;
      ELSE
        NEW.created_by_type := 'admin'::creator_type;
    END CASE;
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Update has_merchant_used_trial function
CREATE OR REPLACE FUNCTION public.has_merchant_used_trial(p_merchant_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 STABLE
 SECURITY DEFINER
 SET search_path = ''
AS $function$
BEGIN
  RETURN EXISTS(
    SELECT 1 
    FROM public.merchant_subscriptions 
    WHERE merchant_id = p_merchant_id 
      AND is_trial = true
  );
END;
$function$;

-- Update get_trial_plan_settings function
CREATE OR REPLACE FUNCTION public.get_trial_plan_settings()
 RETURNS TABLE(enabled boolean, duration_days integer, plan_name text, max_study_halls integer)
 LANGUAGE plpgsql
 STABLE
 SECURITY DEFINER
 SET search_path = ''
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    trial_plan_enabled,
    trial_duration_days,
    trial_plan_name,
    trial_max_study_halls
  FROM public.business_settings
  LIMIT 1;
END;
$function$;

-- Update auto_release_expired_bookings function
CREATE OR REPLACE FUNCTION public.auto_release_expired_bookings()
 RETURNS TABLE(released_count integer, released_booking_ids uuid[])
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = ''
AS $function$
DECLARE
  v_today DATE := CURRENT_DATE;
  v_expired_bookings UUID[];
  v_expired_seats UUID[];
  v_count INTEGER;
BEGIN
  -- Find expired bookings
  SELECT ARRAY_AGG(id), ARRAY_AGG(seat_id)
  INTO v_expired_bookings, v_expired_seats
  FROM public.bookings
  WHERE status IN ('active', 'confirmed')
    AND end_date < v_today;
  
  v_count := COALESCE(array_length(v_expired_bookings, 1), 0);
  
  IF v_count > 0 THEN
    -- Update bookings to completed
    UPDATE public.bookings 
    SET status = 'completed', updated_at = NOW()
    WHERE id = ANY(v_expired_bookings);
    
    -- Release seats
    UPDATE public.seats 
    SET is_available = true 
    WHERE id = ANY(v_expired_seats);
    
    -- Log the operation
    RAISE NOTICE 'Auto-released % expired bookings', v_count;
  END IF;
  
  RETURN QUERY SELECT v_count, v_expired_bookings;
END;
$function$;

-- Update update_study_hall_rating function
CREATE OR REPLACE FUNCTION public.update_study_hall_rating()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = ''
AS $function$
DECLARE
  new_avg DECIMAL(3,2);
  review_count INTEGER;
BEGIN
  -- Calculate average rating and count for the study hall
  SELECT 
    COALESCE(AVG(rating), 0)::DECIMAL(3,2),
    COUNT(*)::INTEGER
  INTO new_avg, review_count
  FROM public.study_hall_reviews 
  WHERE study_hall_id = COALESCE(NEW.study_hall_id, OLD.study_hall_id)
  AND status = 'approved';
  
  -- Update study hall with new rating
  UPDATE public.study_halls 
  SET 
    average_rating = new_avg,
    total_reviews = review_count,
    updated_at = now()
  WHERE id = COALESCE(NEW.study_hall_id, OLD.study_hall_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$function$;