-- Phase 1: Add support for variable seats per row in study halls

-- Add new column for custom row seat configuration
ALTER TABLE public.study_halls 
ADD COLUMN row_seat_config JSONB DEFAULT NULL;

-- Add layout_mode column to distinguish between fixed and custom layouts
ALTER TABLE public.study_halls 
ADD COLUMN layout_mode TEXT DEFAULT 'fixed' CHECK (layout_mode IN ('fixed', 'custom'));

-- Update the manage_study_hall_seats function to support both fixed and custom layouts
CREATE OR REPLACE FUNCTION public.manage_study_hall_seats()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
DECLARE
  row_index INTEGER;
  seat_index INTEGER;
  row_name TEXT;
  seats_for_row INTEGER;
  row_config JSONB;
  existing_seat_mappings JSONB := '[]'::jsonb;
BEGIN
  RAISE LOG 'Seat management triggered for study hall %: % (layout_mode: %)', 
    NEW.id, NEW.name, NEW.layout_mode;
  
  -- For UPDATE operations, preserve existing bookings
  IF TG_OP = 'UPDATE' THEN
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
  
  -- Create new seats based on layout mode
  IF NEW.layout_mode = 'custom' AND NEW.row_seat_config IS NOT NULL THEN
    -- Custom layout: variable seats per row
    FOR row_name, row_config IN SELECT * FROM jsonb_each(NEW.row_seat_config)
    LOOP
      seats_for_row := (row_config->>'seats')::INTEGER;
      
      FOR seat_index IN 1..seats_for_row LOOP
        INSERT INTO public.seats (study_hall_id, seat_id, row_name, seat_number)
        VALUES (NEW.id, row_name || seat_index::text, row_name, seat_index);
      END LOOP;
      
      RAISE LOG 'Created % seats for row % in study hall %', seats_for_row, row_name, NEW.id;
    END LOOP;
  ELSE
    -- Fixed layout: uniform grid (backward compatibility)
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
    
    RAISE LOG 'Created % seats using fixed layout (% rows x % seats)', 
      NEW.total_seats, NEW.rows, NEW.seats_per_row;
  END IF;
  
  -- Calculate and update total_seats for custom layouts
  IF NEW.layout_mode = 'custom' AND NEW.row_seat_config IS NOT NULL THEN
    DECLARE
      calculated_total INTEGER;
    BEGIN
      SELECT COUNT(*) INTO calculated_total
      FROM public.seats
      WHERE study_hall_id = NEW.id;
      
      -- Update total_seats if it doesn't match
      IF calculated_total != NEW.total_seats THEN
        UPDATE public.study_halls 
        SET total_seats = calculated_total
        WHERE id = NEW.id;
        
        RAISE LOG 'Updated total_seats from % to % for custom layout', NEW.total_seats, calculated_total;
      END IF;
    END;
  END IF;
  
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

-- Update triggers to handle new columns
DROP TRIGGER IF EXISTS create_seats_trigger ON public.study_halls;
DROP TRIGGER IF EXISTS update_seats_trigger ON public.study_halls;

CREATE TRIGGER create_seats_trigger
    AFTER INSERT ON public.study_halls
    FOR EACH ROW
    EXECUTE FUNCTION public.manage_study_hall_seats();

CREATE TRIGGER update_seats_trigger
    AFTER UPDATE OF rows, seats_per_row, custom_row_names, layout_mode, row_seat_config ON public.study_halls
    FOR EACH ROW
    EXECUTE FUNCTION public.manage_study_hall_seats();

-- Create helper function to calculate total seats from row config
CREATE OR REPLACE FUNCTION public.calculate_total_seats_from_config(row_seat_config JSONB)
RETURNS INTEGER
LANGUAGE plpgsql
IMMUTABLE
AS $function$
DECLARE
  total INTEGER := 0;
  row_config JSONB;
BEGIN
  FOR row_config IN SELECT value FROM jsonb_each(row_seat_config)
  LOOP
    total := total + (row_config->>'seats')::INTEGER;
  END LOOP;
  
  RETURN total;
END;
$function$;