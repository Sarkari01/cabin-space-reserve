-- Phase 1: Drop and recreate create_cabin_booking function with proper schema path
DROP FUNCTION IF EXISTS public.create_cabin_booking(uuid,uuid,date,date,integer,numeric,numeric,text,text,text);

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
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    booking_id uuid;
    user_uuid uuid;
    cabin_exists boolean;
    hall_exists boolean;
BEGIN
    -- Set explicit search path to ensure we're in the public schema
    SET search_path TO 'public';
    
    -- Log function start
    RAISE LOG 'Auth context - UID: %, Role: %', auth.uid(), auth.role();
    
    -- Get authenticated user ID
    user_uuid := auth.uid();
    
    -- Validate cabin exists and belongs to the private hall
    SELECT EXISTS(
        SELECT 1 FROM public.cabins 
        WHERE id = p_cabin_id AND private_hall_id = p_private_hall_id
    ) INTO cabin_exists;
    
    IF NOT cabin_exists THEN
        RAISE LOG 'Cabin validation failed - Cabin: %, Hall: %', p_cabin_id, p_private_hall_id;
        RAISE EXCEPTION 'Invalid cabin or private hall';
    END IF;
    
    -- Validate private hall exists and is active
    SELECT EXISTS(
        SELECT 1 FROM public.private_halls 
        WHERE id = p_private_hall_id AND status = 'active'
    ) INTO hall_exists;
    
    IF NOT hall_exists THEN
        RAISE LOG 'Private hall validation failed - Hall: %', p_private_hall_id;
        RAISE EXCEPTION 'Private hall not found or inactive';
    END IF;
    
    -- Check cabin availability for the date range
    IF NOT public.check_cabin_availability_for_dates(p_cabin_id, p_start_date, p_end_date) THEN
        RAISE LOG 'Cabin availability check failed - Cabin: %, Dates: % to %', p_cabin_id, p_start_date, p_end_date;
        RAISE EXCEPTION 'Cabin is not available for the selected dates';
    END IF;
    
    -- Create the booking record with explicit table reference
    BEGIN
        INSERT INTO public.cabin_bookings (
            user_id,
            cabin_id,
            private_hall_id,
            start_date,
            end_date,
            months_booked,
            monthly_amount,
            total_amount,
            status,
            payment_status,
            guest_name,
            guest_phone,
            guest_email
        ) VALUES (
            user_uuid,
            p_cabin_id,
            p_private_hall_id,
            p_start_date,
            p_end_date,
            p_months_booked,
            p_monthly_amount,
            p_total_amount,
            'pending',
            'unpaid',
            p_guest_name,
            p_guest_phone,
            p_guest_email
        ) RETURNING id INTO booking_id;
        
        RAISE LOG 'Successfully created cabin booking: %', booking_id;
        
    EXCEPTION WHEN OTHERS THEN
        RAISE LOG 'Error creating cabin booking: % %', SQLSTATE, SQLERRM;
        RAISE EXCEPTION 'Failed to create booking: %', SQLERRM;
    END;
    
    RETURN booking_id;
END;
$$;