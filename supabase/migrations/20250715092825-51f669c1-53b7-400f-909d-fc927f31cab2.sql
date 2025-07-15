-- Fix the audit function with proper variable naming
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
    FROM seats s
    WHERE s.study_hall_id = hall_record.id;
    
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