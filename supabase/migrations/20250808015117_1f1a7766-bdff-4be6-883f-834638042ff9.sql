-- Fix vacate flow: ensure we never set status = 'vacated' (enum doesn't include it)
-- and return a consistent JSON payload expected by the edge function

-- Create or replace function to vacate a cabin booking safely
CREATE OR REPLACE FUNCTION public.vacate_cabin_booking(
  p_booking_id uuid,
  p_vacated_by_user_id uuid,
  p_reason text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public
AS $$
DECLARE
  v_booking RECORD;
BEGIN
  -- Validate booking exists
  SELECT * INTO v_booking
  FROM public.cabin_bookings
  WHERE id = p_booking_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Booking not found');
  END IF;

  -- Mark as vacated and complete the booking
  UPDATE public.cabin_bookings
  SET 
    is_vacated = true,
    vacated_at = now(),
    vacated_by = p_vacated_by_user_id,
    vacate_reason = COALESCE(p_reason, vacate_reason),
    status = 'completed',
    updated_at = now()
  WHERE id = p_booking_id;

  -- Free up the cabin (set to available)
  UPDATE public.cabins
  SET status = 'available', updated_at = now()
  WHERE id = v_booking.cabin_id;

  RETURN jsonb_build_object(
    'success', true,
    'booking_id', p_booking_id,
    'vacated_at', now()
  );
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'error', SQLERRM, 'sqlstate', SQLSTATE);
END;
$$;

-- Optional: guard function to update cabin booking status with valid enum values only
-- This prevents accidental 'vacated' usage in any callers
CREATE OR REPLACE FUNCTION public.update_cabin_booking_status(
  p_booking_id uuid,
  p_new_status text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public
AS $$
DECLARE
  v_allowed text[] := ARRAY['pending','active','completed','cancelled'];
  v_booking record;
BEGIN
  IF NOT (p_new_status = ANY (v_allowed)) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid status value');
  END IF;

  UPDATE public.cabin_bookings
  SET status = p_new_status::text, updated_at = now()
  WHERE id = p_booking_id
  RETURNING * INTO v_booking;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Booking not found');
  END IF;

  -- Keep cabin availability in sync for terminal states
  IF p_new_status IN ('completed','cancelled') THEN
    UPDATE public.cabins
    SET status = 'available', updated_at = now()
    WHERE id = v_booking.cabin_id;
  END IF;

  RETURN jsonb_build_object('success', true);
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'error', SQLERRM, 'sqlstate', SQLSTATE);
END;
$$;