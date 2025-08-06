-- Enhanced create_cabin_booking function with better authentication and error handling
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
SET search_path TO 'public'
AS $$
DECLARE
    v_user_id uuid;
    v_booking_id uuid;
    v_cabin_exists boolean;
    v_hall_exists boolean;
    v_availability boolean;
BEGIN
    -- Debug authentication context
    RAISE LOG 'Auth context - UID: %, Role: %', auth.uid(), auth.role();
    
    -- Get authenticated user ID
    v_user_id := auth.uid();
    
    -- Check if user is authenticated (required for non-guest bookings)
    IF v_user_id IS NULL AND p_guest_name IS NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Authentication required for user bookings',
            'code', 'AUTH_REQUIRED'
        );
    END IF;
    
    -- Validate cabin exists and is available
    SELECT EXISTS(
        SELECT 1 FROM public.cabins 
        WHERE id = p_cabin_id AND status = 'available'
    ) INTO v_cabin_exists;
    
    IF NOT v_cabin_exists THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Cabin not found or not available',
            'code', 'CABIN_UNAVAILABLE'
        );
    END IF;
    
    -- Validate private hall exists and is active
    SELECT EXISTS(
        SELECT 1 FROM public.private_halls 
        WHERE id = p_private_hall_id AND status = 'active'
    ) INTO v_hall_exists;
    
    IF NOT v_hall_exists THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Private hall not found or not active',
            'code', 'HALL_UNAVAILABLE'
        );
    END IF;
    
    -- Check cabin availability for the requested dates
    SELECT public.check_cabin_availability_for_dates(p_cabin_id, p_start_date, p_end_date) 
    INTO v_availability;
    
    IF NOT v_availability THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Cabin is not available for the selected dates',
            'code', 'DATE_CONFLICT'
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
        v_user_id,
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
    ) RETURNING id INTO v_booking_id;
    
    RAISE LOG 'Cabin booking created successfully: %', v_booking_id;
    
    -- Return success response
    RETURN jsonb_build_object(
        'success', true,
        'booking_id', v_booking_id,
        'message', 'Booking created successfully'
    );
    
EXCEPTION WHEN OTHERS THEN
    RAISE LOG 'Error creating cabin booking: % %', SQLSTATE, SQLERRM;
    RETURN jsonb_build_object(
        'success', false,
        'error', 'Database error: ' || SQLERRM,
        'code', 'DB_ERROR',
        'sqlstate', SQLSTATE
    );
END;
$$;