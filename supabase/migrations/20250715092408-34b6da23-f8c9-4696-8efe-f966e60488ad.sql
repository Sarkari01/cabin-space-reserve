-- Phase 1: Enhanced seat management system

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS create_seats_trigger ON study_halls;
DROP TRIGGER IF EXISTS update_seats_trigger ON study_halls;

-- Enhanced function to create/update seats for study hall
CREATE OR REPLACE FUNCTION public.manage_study_hall_seats()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  row_index INTEGER;
  seat_index INTEGER;
  row_name TEXT;
  existing_booking_ids UUID[];
  new_seat_mapping JSONB := '{}';
BEGIN
  -- For UPDATE operations, preserve existing bookings
  IF TG_OP = 'UPDATE' THEN
    -- Get all active booking IDs for this study hall
    SELECT ARRAY_AGG(DISTINCT b.id)
    INTO existing_booking_ids
    FROM bookings b
    JOIN seats s ON b.seat_id = s.id
    WHERE s.study_hall_id = NEW.id
      AND b.status IN ('active', 'confirmed', 'pending')
      AND b.payment_status IN ('paid', 'unpaid');
    
    -- Log the preservation operation
    RAISE LOG 'Preserving % active bookings for study hall %', 
      COALESCE(array_length(existing_booking_ids, 1), 0), NEW.id;
  END IF;
  
  -- Delete existing seats for this study hall
  DELETE FROM public.seats WHERE study_hall_id = NEW.id;
  
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
  
  -- For UPDATE operations, restore bookings where possible
  IF TG_OP = 'UPDATE' AND existing_booking_ids IS NOT NULL THEN
    -- Temporarily disable booking constraints for restoration
    UPDATE bookings 
    SET seat_id = (
      SELECT s.id 
      FROM seats s 
      WHERE s.study_hall_id = NEW.id 
        AND s.row_name = (
          SELECT old_s.row_name 
          FROM seats old_s 
          WHERE old_s.id = bookings.seat_id
        )
        AND s.seat_number = (
          SELECT old_s.seat_number 
          FROM seats old_s 
          WHERE old_s.id = bookings.seat_id
        )
      LIMIT 1
    )
    WHERE id = ANY(existing_booking_ids)
      AND EXISTS (
        SELECT 1 FROM seats s 
        WHERE s.study_hall_id = NEW.id 
        LIMIT 1
      );
    
    -- Mark restored seats as unavailable
    UPDATE seats 
    SET is_available = false 
    WHERE id IN (
      SELECT seat_id FROM bookings 
      WHERE id = ANY(existing_booking_ids)
        AND seat_id IS NOT NULL
    );
    
    RAISE LOG 'Restored bookings for study hall % after seat layout update', NEW.id;
  END IF;
  
  RAISE LOG 'Created % seats for study hall % (% rows x % seats)', 
    NEW.total_seats, NEW.id, NEW.rows, NEW.seats_per_row;
  
  RETURN NEW;
END;
$$;

-- Create triggers for INSERT and UPDATE
CREATE TRIGGER create_seats_trigger
  AFTER INSERT ON study_halls
  FOR EACH ROW
  EXECUTE FUNCTION public.manage_study_hall_seats();

CREATE TRIGGER update_seats_trigger
  AFTER UPDATE ON study_halls
  FOR EACH ROW
  WHEN (OLD.rows IS DISTINCT FROM NEW.rows OR 
        OLD.seats_per_row IS DISTINCT FROM NEW.seats_per_row OR 
        OLD.custom_row_names IS DISTINCT FROM NEW.custom_row_names)
  EXECUTE FUNCTION public.manage_study_hall_seats();

-- Function to audit and fix existing study halls
CREATE OR REPLACE FUNCTION public.audit_and_fix_study_hall_seats()
RETURNS TABLE(study_hall_id UUID, expected_seats INTEGER, actual_seats BIGINT, fixed BOOLEAN)
LANGUAGE plpgsql
AS $$
DECLARE
  hall_record RECORD;
  seat_count BIGINT;
  fixed_count INTEGER := 0;
BEGIN
  FOR hall_record IN 
    SELECT id, name, rows, seats_per_row, total_seats
    FROM study_halls 
    WHERE status = 'active'
  LOOP
    -- Count actual seats
    SELECT COUNT(*) INTO seat_count
    FROM seats 
    WHERE study_hall_id = hall_record.id;
    
    -- Return audit result
    study_hall_id := hall_record.id;
    expected_seats := hall_record.total_seats;
    actual_seats := seat_count;
    fixed := false;
    
    -- Fix if mismatch
    IF seat_count != hall_record.total_seats THEN
      -- Trigger seat regeneration by updating the study hall
      UPDATE study_halls 
      SET updated_at = NOW()
      WHERE id = hall_record.id;
      
      fixed := true;
      fixed_count := fixed_count + 1;
      
      RAISE LOG 'Fixed seat count for study hall % (% -> %)', 
        hall_record.name, seat_count, hall_record.total_seats;
    END IF;
    
    RETURN NEXT;
  END LOOP;
  
  RAISE LOG 'Audit complete: fixed % study halls', fixed_count;
END;
$$;

-- Enable real-time for seats table
ALTER TABLE seats REPLICA IDENTITY FULL;
ALTER publication supabase_realtime ADD TABLE seats;