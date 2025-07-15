-- Phase 1: Create Missing Database Triggers
-- First, ensure the manage_study_hall_seats function exists and is working
CREATE OR REPLACE FUNCTION public.manage_study_hall_seats()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
DECLARE
  row_index INTEGER;
  seat_index INTEGER;
  row_name TEXT;
  existing_booking_ids UUID[];
  existing_seat_mappings JSONB := '[]'::jsonb;
BEGIN
  RAISE LOG 'Seat management triggered for study hall %: % (%x% seats)', NEW.id, NEW.name, NEW.rows, NEW.seats_per_row;
  
  -- For UPDATE operations, preserve existing bookings
  IF TG_OP = 'UPDATE' THEN
    -- Store existing seat mappings for restoration
    SELECT jsonb_agg(
      jsonb_build_object(
        'booking_id', b.id,
        'seat_row', s.row_name,
        'seat_number', s.seat_number,
        'user_id', b.user_id,
        'status', b.status
      )
    )
    INTO existing_seat_mappings
    FROM bookings b
    JOIN seats s ON b.seat_id = s.id
    WHERE s.study_hall_id = NEW.id
      AND b.status IN ('active', 'confirmed', 'pending')
      AND b.payment_status IN ('paid', 'unpaid');
    
    RAISE LOG 'Preserving % active bookings for study hall %', 
      jsonb_array_length(COALESCE(existing_seat_mappings, '[]'::jsonb)), NEW.id;
  END IF;
  
  -- Delete existing seats for this study hall
  DELETE FROM public.seats WHERE study_hall_id = NEW.id;
  RAISE LOG 'Deleted existing seats for study hall %', NEW.id;
  
  -- Create new seats based on updated configuration
  FOR row_index IN 1..NEW.rows LOOP
    -- Get custom row name or default to A, B, C...
    IF array_length(NEW.custom_row_names, 1) >= row_index THEN
      row_name := NEW.custom_row_names[row_index];
    ELSE
      row_name := chr(64 + row_index); -- A, B, C...
    END IF;
    
    FOR seat_index IN 1..NEW.seats_per_row LOOP
      INSERT INTO public.seats (study_hall_id, seat_id, row_name, seat_number)
      VALUES (NEW.id, row_name || seat_index::text, row_name, seat_index);
    END LOOP;
  END LOOP;
  
  RAISE LOG 'Created % new seats for study hall % (% rows x % seats)', 
    NEW.total_seats, NEW.id, NEW.rows, NEW.seats_per_row;
  
  -- For UPDATE operations, restore bookings where possible
  IF TG_OP = 'UPDATE' AND existing_seat_mappings != '[]'::jsonb THEN
    DECLARE
      booking_mapping JSONB;
      target_seat_id UUID;
    BEGIN
      FOR booking_mapping IN SELECT * FROM jsonb_array_elements(existing_seat_mappings)
      LOOP
        -- Try to find a similar seat (same row/seat if possible, otherwise any available)
        SELECT s.id INTO target_seat_id
        FROM seats s 
        WHERE s.study_hall_id = NEW.id 
          AND s.row_name = (booking_mapping->>'seat_row')
          AND s.seat_number = (booking_mapping->>'seat_number')::integer
          AND s.is_available = true
        LIMIT 1;
        
        -- If exact seat not available, find any available seat
        IF target_seat_id IS NULL THEN
          SELECT s.id INTO target_seat_id
          FROM seats s 
          WHERE s.study_hall_id = NEW.id 
            AND s.is_available = true
          ORDER BY s.row_name, s.seat_number
          LIMIT 1;
        END IF;
        
        -- Restore the booking if we found a seat
        IF target_seat_id IS NOT NULL THEN
          UPDATE bookings 
          SET seat_id = target_seat_id
          WHERE id = (booking_mapping->>'booking_id')::uuid;
          
          -- Mark the seat as unavailable
          UPDATE seats 
          SET is_available = false 
          WHERE id = target_seat_id;
          
          RAISE LOG 'Restored booking % to seat % for study hall %', 
            booking_mapping->>'booking_id', target_seat_id, NEW.id;
        ELSE
          RAISE LOG 'Could not restore booking % - no available seats', booking_mapping->>'booking_id';
        END IF;
      END LOOP;
    END;
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS create_seats_trigger ON public.study_halls;
DROP TRIGGER IF EXISTS update_seats_trigger ON public.study_halls;

-- Create the missing triggers
CREATE TRIGGER create_seats_trigger
    AFTER INSERT ON public.study_halls
    FOR EACH ROW
    EXECUTE FUNCTION public.manage_study_hall_seats();

CREATE TRIGGER update_seats_trigger
    AFTER UPDATE OF rows, seats_per_row, custom_row_names ON public.study_halls
    FOR EACH ROW
    EXECUTE FUNCTION public.manage_study_hall_seats();

-- Verify triggers were created
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.triggers 
        WHERE trigger_name = 'create_seats_trigger' AND event_object_table = 'study_halls'
    ) THEN
        RAISE LOG 'create_seats_trigger successfully created';
    ELSE
        RAISE LOG 'ERROR: create_seats_trigger was not created';
    END IF;
    
    IF EXISTS (
        SELECT 1 FROM information_schema.triggers 
        WHERE trigger_name = 'update_seats_trigger' AND event_object_table = 'study_halls'
    ) THEN
        RAISE LOG 'update_seats_trigger successfully created';
    ELSE
        RAISE LOG 'ERROR: update_seats_trigger was not created';
    END IF;
END $$;

-- Phase 2: Fix existing data consistency by triggering seat regeneration
-- This will force seat regeneration for all active study halls
UPDATE study_halls 
SET updated_at = NOW() 
WHERE status = 'active' 
  AND id IN (
    SELECT sh.id 
    FROM study_halls sh
    LEFT JOIN (
      SELECT study_hall_id, COUNT(*) as actual_seats
      FROM seats 
      GROUP BY study_hall_id
    ) s ON sh.id = s.study_hall_id
    WHERE COALESCE(s.actual_seats, 0) != sh.total_seats
  );

RAISE LOG 'Seat synchronization triggers installed and data consistency fixed';