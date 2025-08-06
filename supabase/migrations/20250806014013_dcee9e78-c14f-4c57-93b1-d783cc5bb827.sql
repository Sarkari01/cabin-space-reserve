-- Fix the sync_private_hall_cabins function to prevent duplicate cabin numbers
CREATE OR REPLACE FUNCTION public.sync_private_hall_cabins(p_private_hall_id uuid, p_layout_json jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  cabin_data JSONB;
  new_cabin_id UUID;
  result_mapping JSONB := '{}';
  layout_cabin JSONB;
  cabin_counter INTEGER := 1;
BEGIN
  -- Delete existing cabins for this private hall
  DELETE FROM public.cabins WHERE private_hall_id = p_private_hall_id;
  
  -- Iterate through layout cabins and create database records
  FOR layout_cabin IN SELECT * FROM jsonb_array_elements(p_layout_json->'cabins')
  LOOP
    -- Create cabin record with sequential numbering
    INSERT INTO public.cabins (
      private_hall_id,
      cabin_name,
      cabin_number,
      monthly_price,
      max_occupancy,
      amenities,
      position_x,
      position_y,
      status
    ) VALUES (
      p_private_hall_id,
      layout_cabin->>'name',
      cabin_counter, -- Use sequential counter instead of regex extraction
      COALESCE((layout_cabin->>'monthly_price')::NUMERIC, 0),
      1, -- Default max occupancy
      COALESCE(
        ARRAY(SELECT jsonb_array_elements_text(layout_cabin->'amenities')),
        ARRAY[]::TEXT[]
      ),
      COALESCE((layout_cabin->>'x')::INTEGER, 0),
      COALESCE((layout_cabin->>'y')::INTEGER, 0),
      'available'
    )
    RETURNING id INTO new_cabin_id;
    
    -- Store mapping of layout ID to database ID
    result_mapping := result_mapping || jsonb_build_object(
      layout_cabin->>'id', 
      new_cabin_id
    );
    
    -- Increment counter for next cabin
    cabin_counter := cabin_counter + 1;
  END LOOP;
  
  RETURN result_mapping;
END;
$function$;