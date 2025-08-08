-- Create or replace function to vacate a cabin booking without using a non-existent enum value
CREATE OR REPLACE FUNCTION public.vacate_cabin_booking(
  p_booking_id uuid,
  p_vacated_by_user_id uuid,
  p_reason text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_booking RECORD;
BEGIN
  SELECT * INTO v_booking FROM public.cabin_bookings WHERE id = p_booking_id FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Booking not found');
  END IF;

  UPDATE public.cabin_bookings
  SET
    is_vacated = true,
    vacated_at = now(),
    vacated_by = p_vacated_by_user_id,
    -- Move booking to completed if it was pending/active
    status = CASE WHEN status IN ('pending','active') THEN 'completed' ELSE status END,
    updated_at = now()
  WHERE id = p_booking_id
  RETURNING * INTO v_booking;

  RETURN jsonb_build_object(
    'success', true,
    'booking_id', v_booking.id,
    'new_status', v_booking.status,
    'is_vacated', v_booking.is_vacated,
    'vacated_at', v_booking.vacated_at
  );
END;
$$;

-- Create or replace function to auto-expire cabin bookings whose end_date has passed
CREATE OR REPLACE FUNCTION public.auto_expire_cabin_bookings()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  expired_ids uuid[];
  updated_count integer := 0;
BEGIN
  WITH to_update AS (
    SELECT id
    FROM public.cabin_bookings
    WHERE payment_status = 'paid'
      AND COALESCE(is_vacated, false) = false
      AND end_date < CURRENT_DATE
      AND status IN ('active','pending')
  ), updated AS (
    UPDATE public.cabin_bookings cb
    SET status = 'completed',
        updated_at = now()
    WHERE cb.id IN (SELECT id FROM to_update)
    RETURNING cb.id
  )
  SELECT array_agg(id), count(*) INTO expired_ids, updated_count FROM updated;

  RETURN jsonb_build_object(
    'success', true,
    'expired_count', COALESCE(updated_count, 0),
    'expired_ids', COALESCE(expired_ids, ARRAY[]::uuid[])
  );
END;
$$;

-- Create or replace function to safely update cabin booking status
CREATE OR REPLACE FUNCTION public.update_cabin_booking_status(
  p_booking_id uuid,
  p_new_status text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_allowed text[] := ARRAY['pending','active','cancelled','completed'];
  v_booking RECORD;
BEGIN
  IF p_new_status IS NULL OR NOT (p_new_status = ANY (v_allowed)) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid status');
  END IF;

  UPDATE public.cabin_bookings
  SET status = p_new_status,
      updated_at = now()
  WHERE id = p_booking_id
  RETURNING * INTO v_booking;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Booking not found');
  END IF;

  RETURN jsonb_build_object('success', true, 'booking_id', v_booking.id, 'new_status', v_booking.status);
END;
$$;