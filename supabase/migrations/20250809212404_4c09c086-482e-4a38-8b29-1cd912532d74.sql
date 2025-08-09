-- Create unambiguous cabin availability wrapper function
CREATE OR REPLACE FUNCTION public.verify_cabin_availability(
  p_cabin_id uuid,
  p_start_date date,
  p_end_date date
)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN NOT EXISTS (
    SELECT 1
    FROM public.cabin_bookings cb
    WHERE cb.cabin_id = p_cabin_id
      AND cb.payment_status = 'paid'
      AND COALESCE(cb.is_vacated, false) = false
      AND cb.start_date <= p_end_date
      AND cb.end_date >= p_start_date
  );
END;
$$;

-- Ensure function is callable by client roles
GRANT EXECUTE ON FUNCTION public.verify_cabin_availability(uuid, date, date) TO anon, authenticated;