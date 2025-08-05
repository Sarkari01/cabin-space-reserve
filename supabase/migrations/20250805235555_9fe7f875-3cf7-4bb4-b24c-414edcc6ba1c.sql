-- Create a secure function for cabin booking creation
CREATE OR REPLACE FUNCTION public.create_cabin_booking(
  p_cabin_id uuid,
  p_private_hall_id uuid,
  p_start_date date,
  p_end_date date,
  p_months_booked integer,
  p_monthly_amount numeric,
  p_total_amount numeric,
  p_guest_name text DEFAULT NULL,
  p_guest_phone text DEFAULT NULL,
  p_guest_email text DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_booking_id uuid;
  current_user_id uuid;
BEGIN
  -- Get current user ID
  current_user_id := auth.uid();
  
  -- Validate user is authenticated for non-guest bookings
  IF current_user_id IS NULL AND p_guest_name IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Authentication required for user bookings'
    );
  END IF;
  
  -- Check cabin availability
  IF NOT public.check_cabin_availability_for_dates(p_cabin_id, p_start_date, p_end_date) THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Cabin is not available for the selected dates'
    );
  END IF;
  
  -- Create the booking
  INSERT INTO public.cabin_bookings (
    user_id,
    cabin_id,
    private_hall_id,
    start_date,
    end_date,
    months_booked,
    monthly_amount,
    total_amount,
    guest_name,
    guest_phone,
    guest_email,
    status,
    payment_status
  ) VALUES (
    current_user_id,
    p_cabin_id,
    p_private_hall_id,
    p_start_date,
    p_end_date,
    p_months_booked,
    p_monthly_amount,
    p_total_amount,
    p_guest_name,
    p_guest_phone,
    p_guest_email,
    'pending',
    'unpaid'
  ) RETURNING id INTO new_booking_id;
  
  -- Return success with booking ID
  RETURN jsonb_build_object(
    'success', true,
    'booking_id', new_booking_id
  );
  
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'success', false,
    'error', SQLERRM,
    'error_code', SQLSTATE
  );
END;
$$;