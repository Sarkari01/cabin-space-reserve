-- Public landing stats without exposing PII
BEGIN;

CREATE OR REPLACE FUNCTION public.get_public_landing_stats()
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_users bigint := 0;
  v_merchants bigint := 0;
  v_study_halls bigint := 0;
  v_bookings bigint := 0;
BEGIN
  SELECT COUNT(*) INTO v_users FROM public.profiles;
  SELECT COUNT(*) INTO v_merchants FROM public.profiles WHERE role = 'merchant';
  SELECT COUNT(*) INTO v_study_halls FROM public.study_halls WHERE status = 'active';
  SELECT COUNT(*) INTO v_bookings FROM public.bookings;

  RETURN jsonb_build_object(
    'users', v_users,
    'merchants', v_merchants,
    'study_halls', v_study_halls,
    'bookings', v_bookings
  );
END;
$$;

-- Restrict execution to expected roles
REVOKE ALL ON FUNCTION public.get_public_landing_stats() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_landing_stats() TO anon, authenticated;

COMMIT;