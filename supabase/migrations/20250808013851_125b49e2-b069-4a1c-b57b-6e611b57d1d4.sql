-- Add vacate_reason column to cabin_bookings if missing
ALTER TABLE public.cabin_bookings
ADD COLUMN IF NOT EXISTS vacate_reason text;

-- Safely create or replace function to vacate a cabin booking and record reason
CREATE OR REPLACE FUNCTION public.vacate_cabin_booking(
  p_booking_id uuid,
  p_vacated_by_user_id uuid DEFAULT NULL,
  p_reason text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_booking RECORD;
  v_role text;
  v_is_admin boolean := false;
  v_is_telemarketing boolean := false;
  v_is_merchant_owner boolean := false;
  v_effective_user uuid := COALESCE(p_vacated_by_user_id, auth.uid());
BEGIN
  -- Load booking with hall and cabin for permission checks and updates
  SELECT cb.*, ph.merchant_id
  INTO v_booking
  FROM public.cabin_bookings cb
  JOIN public.private_halls ph ON ph.id = cb.private_hall_id
  WHERE cb.id = p_booking_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Cabin booking not found: %', p_booking_id;
  END IF;

  -- Identify caller role
  SELECT role INTO v_role FROM public.profiles WHERE id = auth.uid();
  v_is_admin := v_role = 'admin';
  v_is_telemarketing := v_role = 'telemarketing_executive';
  v_is_merchant_owner := v_role = 'merchant' AND v_booking.merchant_id = auth.uid();

  -- Authorization: allow admin, telemarketing, or owning merchant
  IF NOT (v_is_admin OR v_is_telemarketing OR v_is_merchant_owner) THEN
    RAISE EXCEPTION 'Insufficient permissions to vacate this booking';
  END IF;

  -- Mark booking as vacated - use a valid enum value for status
  UPDATE public.cabin_bookings cb
  SET 
    is_vacated = true,
    vacated_at = now(),
    vacated_by = v_effective_user,
    vacate_reason = p_reason,
    status = 'completed',
    updated_at = now()
  WHERE cb.id = p_booking_id;

  -- Free up the cabin
  UPDATE public.cabins c
  SET status = 'available'
  WHERE c.id = v_booking.cabin_id;

  RETURN jsonb_build_object(
    'success', true,
    'booking_id', p_booking_id,
    'new_status', 'completed',
    'vacated_at', now(),
    'vacate_reason', p_reason
  );
END;
$$;

-- Update status function to ensure only valid enum values are used and keep cabin state in sync
CREATE OR REPLACE FUNCTION public.update_cabin_booking_status(
  p_booking_id uuid,
  p_new_status text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_booking RECORD;
  v_target_status public.cabin_booking_status;
  v_role text;
  v_is_admin boolean := false;
  v_is_telemarketing boolean := false;
  v_is_merchant_owner boolean := false;
BEGIN
  -- Cast incoming text to enum (will raise if invalid)
  v_target_status := p_new_status::public.cabin_booking_status;

  -- Load booking context
  SELECT cb.*, ph.merchant_id
  INTO v_booking
  FROM public.cabin_bookings cb
  JOIN public.private_halls ph ON ph.id = cb.private_hall_id
  WHERE cb.id = p_booking_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Cabin booking not found: %', p_booking_id;
  END IF;

  -- Identify caller role
  SELECT role INTO v_role FROM public.profiles WHERE id = auth.uid();
  v_is_admin := v_role = 'admin';
  v_is_telemarketing := v_role = 'telemarketing_executive';
  v_is_merchant_owner := v_role = 'merchant' AND v_booking.merchant_id = auth.uid();

  -- Authorization: allow admin, telemarketing, or owning merchant
  IF NOT (v_is_admin OR v_is_telemarketing OR v_is_merchant_owner) THEN
    RAISE EXCEPTION 'Insufficient permissions to update this booking';
  END IF;

  -- Update booking status
  UPDATE public.cabin_bookings cb
  SET status = v_target_status, updated_at = now()
  WHERE cb.id = p_booking_id;

  -- Keep cabin state in sync
  IF v_target_status IN ('completed', 'cancelled') THEN
    UPDATE public.cabins SET status = 'available' WHERE id = v_booking.cabin_id;
  ELSIF v_target_status = 'active' THEN
    UPDATE public.cabins SET status = 'occupied' WHERE id = v_booking.cabin_id;
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'booking_id', p_booking_id,
    'new_status', v_target_status
  );
END;
$$;