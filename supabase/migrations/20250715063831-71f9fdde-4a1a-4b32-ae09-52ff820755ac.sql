-- Add indexes for better booking availability performance
CREATE INDEX IF NOT EXISTS idx_bookings_seat_dates 
ON public.bookings (seat_id, start_date, end_date) 
WHERE status IN ('confirmed', 'active', 'pending');

CREATE INDEX IF NOT EXISTS idx_bookings_study_hall_dates 
ON public.bookings (study_hall_id, start_date, end_date) 
WHERE status IN ('confirmed', 'active', 'pending');

CREATE INDEX IF NOT EXISTS idx_bookings_status_end_date 
ON public.bookings (status, end_date);

-- Create function to check seat availability for date ranges
CREATE OR REPLACE FUNCTION public.check_seat_availability(
  p_seat_id UUID,
  p_start_date DATE,
  p_end_date DATE
) RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
AS $$
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
$$;

-- Create function to get available seats for a study hall and date range
CREATE OR REPLACE FUNCTION public.get_available_seats(
  p_study_hall_id UUID,
  p_start_date DATE,
  p_end_date DATE
) RETURNS TABLE(seat_id UUID, seat_identifier TEXT, row_name TEXT, seat_number INTEGER)
LANGUAGE plpgsql
STABLE
AS $$
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
$$;

-- Create function to calculate optimal booking amount
CREATE OR REPLACE FUNCTION public.calculate_booking_amount(
  p_start_date DATE,
  p_end_date DATE,
  p_daily_price NUMERIC,
  p_weekly_price NUMERIC,
  p_monthly_price NUMERIC
) RETURNS TABLE(amount NUMERIC, days INTEGER, method TEXT)
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  v_days INTEGER;
  v_daily_total NUMERIC;
  v_weekly_total NUMERIC;
  v_monthly_total NUMERIC;
  v_final_amount NUMERIC;
  v_method TEXT;
BEGIN
  -- Calculate number of days (inclusive)
  v_days := p_end_date - p_start_date + 1;
  
  -- Calculate different pricing options
  v_daily_total := v_days * p_daily_price;
  v_weekly_total := CEIL(v_days::NUMERIC / 7) * p_weekly_price;
  v_monthly_total := CEIL(v_days::NUMERIC / 30) * p_monthly_price;
  
  -- Choose the most cost-effective option
  v_final_amount := v_daily_total;
  v_method := 'daily';
  
  IF v_days >= 7 AND v_weekly_total < v_final_amount THEN
    v_final_amount := v_weekly_total;
    v_method := 'weekly';
  END IF;
  
  IF v_days >= 30 AND v_monthly_total < v_final_amount THEN
    v_final_amount := v_monthly_total;
    v_method := 'monthly';
  END IF;
  
  RETURN QUERY SELECT v_final_amount, v_days, v_method;
END;
$$;

-- Create function to auto-release expired bookings
CREATE OR REPLACE FUNCTION public.auto_release_expired_bookings()
RETURNS TABLE(released_count INTEGER, released_booking_ids UUID[])
LANGUAGE plpgsql
AS $$
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
$$;