-- Phase 1: Fix generate_short_id function to always generate exactly 6 digits
-- Drop existing function and create new one that generates 100000-999999 (always 6 digits)
CREATE OR REPLACE FUNCTION public.generate_short_id(table_name text, column_name text)
RETURNS integer
LANGUAGE plpgsql
AS $function$
DECLARE
    new_id integer;
    max_attempts integer := 100;
    attempt_count integer := 0;
BEGIN
    LOOP
        -- Generate random 6 digit number (100000 to 999999)
        new_id := floor(random() * 900000 + 100000)::integer;
        
        -- Check if this ID already exists in the specified table
        EXECUTE format('SELECT 1 FROM %I WHERE %I = $1', table_name, column_name) 
        USING new_id;
        
        IF NOT FOUND THEN
            RETURN new_id;
        END IF;
        
        attempt_count := attempt_count + 1;
        IF attempt_count >= max_attempts THEN
            RAISE EXCEPTION 'Unable to generate unique 6-digit ID after % attempts', max_attempts;
        END IF;
    END LOOP;
END;
$function$;

-- Phase 5: Data consistency - ensure all existing bookings have 6-digit booking numbers
-- Update any bookings that might have 5-digit numbers to 6-digit numbers
UPDATE public.bookings 
SET booking_number = generate_short_id('bookings', 'booking_number')
WHERE booking_number IS NULL OR booking_number < 100000;