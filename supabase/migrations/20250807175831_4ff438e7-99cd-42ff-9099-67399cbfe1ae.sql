-- Add vacation fields to cabin_bookings table
ALTER TABLE public.cabin_bookings 
ADD COLUMN IF NOT EXISTS is_vacated BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS vacated_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS vacated_by UUID;

-- Update check_cabin_availability_for_dates function to include vacation logic
CREATE OR REPLACE FUNCTION public.check_cabin_availability_for_dates(
    p_cabin_id uuid, 
    p_start_date date, 
    p_end_date date, 
    p_exclude_booking_id uuid DEFAULT NULL::uuid
)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
AS $$
BEGIN
    RETURN NOT EXISTS (
        SELECT 1 
        FROM public.cabin_bookings 
        WHERE cabin_id = p_cabin_id 
          AND status IN ('active', 'pending')
          AND payment_status != 'failed'
          AND is_vacated = false
          AND (p_exclude_booking_id IS NULL OR id != p_exclude_booking_id)
          AND (
              (start_date <= p_end_date AND end_date >= p_start_date)
          )
    );
END;
$$;

-- Create function to manually vacate cabin booking
CREATE OR REPLACE FUNCTION public.vacate_cabin_booking(
    p_booking_id uuid,
    p_vacated_by_user_id uuid,
    p_reason text DEFAULT 'Manual vacation by user'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_booking record;
    v_cabin_id uuid;
BEGIN
    -- Get booking details
    SELECT * INTO v_booking
    FROM public.cabin_bookings
    WHERE id = p_booking_id;
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Booking not found');
    END IF;
    
    -- Check if booking is already vacated
    IF v_booking.is_vacated THEN
        RETURN jsonb_build_object('success', false, 'error', 'Booking is already vacated');
    END IF;
    
    -- Check if booking is active
    IF v_booking.status NOT IN ('active', 'pending') THEN
        RETURN jsonb_build_object('success', false, 'error', 'Only active or pending bookings can be vacated');
    END IF;
    
    -- Vacate the booking
    UPDATE public.cabin_bookings
    SET 
        is_vacated = true,
        vacated_at = now(),
        vacated_by = p_vacated_by_user_id,
        updated_at = now()
    WHERE id = p_booking_id;
    
    -- Update cabin status to available
    UPDATE public.cabins
    SET status = 'available', updated_at = now()
    WHERE id = v_booking.cabin_id;
    
    -- Create notification for the user
    IF v_booking.user_id IS NOT NULL THEN
        INSERT INTO public.notifications (user_id, title, message, type, action_url)
        VALUES (
            v_booking.user_id,
            'Cabin Booking Vacated',
            'Your cabin booking has been vacated. ' || p_reason,
            'info',
            '/student/dashboard'
        );
    END IF;
    
    RAISE LOG 'Cabin booking % vacated by user %', p_booking_id, p_vacated_by_user_id;
    
    RETURN jsonb_build_object(
        'success', true, 
        'booking_id', p_booking_id,
        'vacated_at', now(),
        'reason', p_reason
    );
END;
$$;

-- Create function to auto-expire cabin bookings
CREATE OR REPLACE FUNCTION public.auto_expire_cabin_bookings()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_expired_bookings uuid[];
    v_count integer := 0;
    booking_record record;
BEGIN
    RAISE LOG 'Starting auto-expiration of cabin bookings';
    
    -- Find bookings that should be expired (end_date has passed and not yet vacated)
    FOR booking_record IN 
        SELECT cb.id, cb.user_id, cb.cabin_id, cb.end_date
        FROM public.cabin_bookings cb
        WHERE cb.status IN ('active', 'pending')
          AND cb.is_vacated = false
          AND cb.end_date < CURRENT_DATE
    LOOP
        -- Mark booking as vacated (auto-expired)
        UPDATE public.cabin_bookings
        SET 
            is_vacated = true,
            vacated_at = now(),
            status = 'completed',
            updated_at = now()
        WHERE id = booking_record.id;
        
        -- Update cabin status to available
        UPDATE public.cabins
        SET status = 'available', updated_at = now()
        WHERE id = booking_record.cabin_id;
        
        -- Create notification for user
        IF booking_record.user_id IS NOT NULL THEN
            INSERT INTO public.notifications (user_id, title, message, type, action_url)
            VALUES (
                booking_record.user_id,
                'Cabin Booking Completed',
                'Your cabin booking period has ended and the cabin has been automatically made available.',
                'info',
                '/student/dashboard'
            );
        END IF;
        
        v_count := v_count + 1;
        
        RAISE LOG 'Auto-expired cabin booking % for cabin %', booking_record.id, booking_record.cabin_id;
    END LOOP;
    
    RAISE LOG 'Auto-expired % cabin bookings', v_count;
    
    RETURN jsonb_build_object(
        'success', true,
        'expired_count', v_count,
        'processed_at', now()
    );
END;
$$;

-- Create function to get cabin availability status
CREATE OR REPLACE FUNCTION public.get_cabin_availability_status(p_cabin_id uuid)
RETURNS TABLE(
    is_available boolean,
    status_reason text,
    booked_until date,
    booking_id uuid,
    days_remaining integer
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
AS $$
DECLARE
    v_active_booking record;
    v_cabin_status text;
BEGIN
    -- Get cabin maintenance status
    SELECT c.status INTO v_cabin_status
    FROM public.cabins c
    WHERE c.id = p_cabin_id;
    
    IF v_cabin_status = 'maintenance' THEN
        RETURN QUERY SELECT false, 'Under maintenance'::text, null::date, null::uuid, 0;
        RETURN;
    END IF;
    
    -- Check for active bookings
    SELECT cb.id, cb.end_date, cb.is_vacated, cb.status
    INTO v_active_booking
    FROM public.cabin_bookings cb
    WHERE cb.cabin_id = p_cabin_id
      AND cb.status IN ('active', 'pending')
      AND cb.payment_status != 'failed'
      AND cb.is_vacated = false
      AND CURRENT_DATE <= cb.end_date
    ORDER BY cb.end_date DESC
    LIMIT 1;
    
    IF FOUND THEN
        -- Cabin is booked
        RETURN QUERY SELECT 
            false,
            'Booked until ' || v_active_booking.end_date::text,
            v_active_booking.end_date,
            v_active_booking.id,
            (v_active_booking.end_date - CURRENT_DATE)::integer;
    ELSE
        -- Cabin is available
        RETURN QUERY SELECT true, 'Available'::text, null::date, null::uuid, 0;
    END IF;
END;
$$;

-- Update handle_cabin_booking_updates trigger to handle vacation logic
CREATE OR REPLACE FUNCTION public.handle_cabin_booking_updates()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- When booking becomes active and paid, mark cabin as occupied (if not vacated)
    IF NEW.status = 'active' AND NEW.payment_status = 'paid' AND OLD.status != 'active' AND NEW.is_vacated = false THEN
        UPDATE public.cabins 
        SET status = 'occupied', updated_at = now()
        WHERE id = NEW.cabin_id;
        
        RAISE LOG 'Cabin % marked as occupied for booking %', NEW.cabin_id, NEW.id;
    END IF;
    
    -- When booking is completed, cancelled, or vacated, mark cabin as available
    IF (NEW.status IN ('completed', 'cancelled') AND OLD.status != NEW.status) OR
       (NEW.is_vacated = true AND OLD.is_vacated = false) THEN
        UPDATE public.cabins 
        SET status = 'available', updated_at = now()
        WHERE id = NEW.cabin_id;
        
        RAISE LOG 'Cabin % marked as available for booking % (reason: %)', 
            NEW.cabin_id, NEW.id, 
            CASE 
                WHEN NEW.is_vacated THEN 'vacated'
                ELSE NEW.status 
            END;
    END IF;
    
    RETURN NEW;
END;
$$;