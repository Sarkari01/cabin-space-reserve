-- Update the create_cabin_booking function to handle deposit amounts (fix parameter ordering)
DROP FUNCTION IF EXISTS public.create_cabin_booking(uuid, uuid, date, date, integer, numeric, numeric, text, text, text);

CREATE OR REPLACE FUNCTION public.create_cabin_booking(
    p_cabin_id uuid,
    p_private_hall_id uuid,
    p_start_date date,
    p_end_date date,
    p_months_booked integer,
    p_monthly_amount numeric,
    p_total_amount numeric,
    p_booking_amount numeric DEFAULT NULL,
    p_deposit_amount numeric DEFAULT NULL,
    p_guest_name text DEFAULT NULL,
    p_guest_phone text DEFAULT NULL,
    p_guest_email text DEFAULT NULL
) 
RETURNS uuid 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    v_booking_id uuid;
    v_user_id uuid;
    v_booking_number integer;
BEGIN
    -- Step 1: Get authenticated user ID
    v_user_id := auth.uid();
    RAISE LOG 'Step 1: User authentication - user_id: %', v_user_id;
    
    -- Step 2: Generate unique booking number
    BEGIN
        v_booking_number := public.generate_short_id('cabin_bookings', 'booking_number');
        RAISE LOG 'Step 2: Generated booking number: %', v_booking_number;
    EXCEPTION WHEN OTHERS THEN
        RAISE LOG 'Step 2 ERROR: Failed to generate booking number - %', SQLERRM;
        RAISE EXCEPTION 'Failed to generate booking number: %', SQLERRM;
    END;
    
    -- Step 3: Validate cabin exists and is available
    BEGIN
        IF NOT EXISTS (
            SELECT 1 FROM public.cabins 
            WHERE id = p_cabin_id 
            AND private_hall_id = p_private_hall_id 
            AND status = 'available'
        ) THEN
            RAISE LOG 'Step 3 ERROR: Cabin not found or not available - cabin_id: %, private_hall_id: %', p_cabin_id, p_private_hall_id;
            RAISE EXCEPTION 'Cabin is not available for booking';
        END IF;
        RAISE LOG 'Step 3: Cabin validation passed - cabin_id: %', p_cabin_id;
    EXCEPTION WHEN OTHERS THEN
        RAISE LOG 'Step 3 ERROR: Cabin validation failed - %', SQLERRM;
        RAISE EXCEPTION 'Cabin validation failed: %', SQLERRM;
    END;
    
    -- Step 4: Check date availability
    BEGIN
        IF NOT public.check_cabin_availability_for_dates(p_cabin_id, p_start_date, p_end_date) THEN
            RAISE LOG 'Step 4 ERROR: Cabin not available for dates - cabin_id: %, start: %, end: %', p_cabin_id, p_start_date, p_end_date;
            RAISE EXCEPTION 'Cabin is not available for the selected dates';
        END IF;
        RAISE LOG 'Step 4: Date availability check passed';
    EXCEPTION WHEN OTHERS THEN
        RAISE LOG 'Step 4 ERROR: Date availability check failed - %', SQLERRM;
        RAISE EXCEPTION 'Date availability check failed: %', SQLERRM;
    END;
    
    -- Step 5: Create the booking with deposit breakdown
    BEGIN
        INSERT INTO public.cabin_bookings (
            id,
            booking_number,
            user_id,
            cabin_id,
            private_hall_id,
            start_date,
            end_date,
            months_booked,
            monthly_amount,
            booking_amount,
            deposit_amount,
            total_amount,
            status,
            payment_status,
            guest_name,
            guest_phone,
            guest_email,
            created_at,
            updated_at
        ) VALUES (
            gen_random_uuid(),
            v_booking_number,
            v_user_id,
            p_cabin_id,
            p_private_hall_id,
            p_start_date,
            p_end_date,
            p_months_booked,
            p_monthly_amount,
            COALESCE(p_booking_amount, p_monthly_amount * p_months_booked),
            COALESCE(p_deposit_amount, 0),
            p_total_amount,
            'pending',
            'unpaid',
            p_guest_name,
            p_guest_phone,
            p_guest_email,
            now(),
            now()
        ) RETURNING id INTO v_booking_id;
        
        RAISE LOG 'Step 5: Booking created successfully - booking_id: %, booking_number: %, booking_amount: %, deposit_amount: %', 
            v_booking_id, v_booking_number, COALESCE(p_booking_amount, p_monthly_amount * p_months_booked), COALESCE(p_deposit_amount, 0);
    EXCEPTION WHEN OTHERS THEN
        RAISE LOG 'Step 5 ERROR: Failed to create booking - %', SQLERRM;
        RAISE EXCEPTION 'Failed to create cabin booking: %', SQLERRM;
    END;
    
    -- Step 6: Return the booking ID
    RAISE LOG 'Step 6: Returning booking_id: %', v_booking_id;
    RETURN v_booking_id;
    
EXCEPTION WHEN OTHERS THEN
    RAISE LOG 'FINAL ERROR in create_cabin_booking: %', SQLERRM;
    RAISE EXCEPTION 'Booking creation failed: %', SQLERRM;
END;
$$;