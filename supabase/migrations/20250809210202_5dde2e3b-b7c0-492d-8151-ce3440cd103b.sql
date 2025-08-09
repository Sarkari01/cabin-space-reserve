-- Create RLS-safe function to get cabin availability for a private hall
CREATE OR REPLACE FUNCTION public.get_private_hall_cabin_availability(p_private_hall_id uuid)
RETURNS TABLE (
  cabin_id uuid,
  cabin_name text,
  status text,
  booked_until date,
  days_remaining integer
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  RETURN QUERY
  WITH latest AS (
    SELECT cb.cabin_id, MAX(cb.end_date) AS booked_until
    FROM public.cabin_bookings cb
    WHERE cb.private_hall_id = p_private_hall_id
      AND cb.payment_status = 'paid'
      AND COALESCE(cb.is_vacated, false) = false
      AND cb.end_date >= CURRENT_DATE
    GROUP BY cb.cabin_id
  )
  SELECT
    c.id AS cabin_id,
    c.cabin_name,
    CASE
      WHEN c.status = 'maintenance' THEN 'maintenance'
      WHEN l.booked_until IS NOT NULL THEN 'occupied'
      ELSE 'available'
    END AS status,
    l.booked_until,
    CASE 
      WHEN l.booked_until IS NOT NULL THEN GREATEST(0, (l.booked_until - CURRENT_DATE))
      ELSE NULL
    END AS days_remaining
  FROM public.cabins c
  LEFT JOIN latest l ON l.cabin_id = c.id
  WHERE c.private_hall_id = p_private_hall_id;
END;
$function$;

-- Helper function to check if a specific cabin is available for a date range
CREATE OR REPLACE FUNCTION public.check_cabin_availability_for_dates(
  p_cabin_id uuid,
  p_start_date date,
  p_end_date date
)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
  v_available boolean;
BEGIN
  -- A cabin is available if there are no overlapping paid, not vacated bookings
  SELECT NOT EXISTS (
    SELECT 1
    FROM public.cabin_bookings cb
    WHERE cb.cabin_id = p_cabin_id
      AND cb.payment_status = 'paid'
      AND COALESCE(cb.is_vacated, false) = false
      AND cb.start_date <= p_end_date
      AND cb.end_date >= p_start_date
  ) INTO v_available;

  RETURN v_available;
END;
$function$;