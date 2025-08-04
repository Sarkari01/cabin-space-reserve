-- Create function to sync layout cabins with database records
CREATE OR REPLACE FUNCTION public.sync_private_hall_cabins(
  p_private_hall_id UUID,
  p_layout_json JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  cabin_data JSONB;
  new_cabin_id UUID;
  result_mapping JSONB := '{}';
  layout_cabin JSONB;
BEGIN
  -- Delete existing cabins for this private hall
  DELETE FROM public.cabins WHERE private_hall_id = p_private_hall_id;
  
  -- Iterate through layout cabins and create database records
  FOR layout_cabin IN SELECT * FROM jsonb_array_elements(p_layout_json->'cabins')
  LOOP
    -- Create cabin record
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
      COALESCE((regexp_match(layout_cabin->>'name', '\d+$'))[1]::INTEGER, 1),
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
  END LOOP;
  
  RETURN result_mapping;
END;
$$;

-- Create function to get cabin ID mapping for a private hall
CREATE OR REPLACE FUNCTION public.get_cabin_id_mapping(
  p_private_hall_id UUID,
  p_layout_cabin_id TEXT
)
RETURNS UUID
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
DECLARE
  cabin_uuid UUID;
BEGIN
  -- Try to find cabin by matching the layout cabin name/pattern
  SELECT id INTO cabin_uuid
  FROM public.cabins
  WHERE private_hall_id = p_private_hall_id
    AND (
      -- Direct match with layout cabin ID (remove 'cabin-' prefix if present)
      cabin_name = REPLACE(p_layout_cabin_id, 'cabin-', '') OR
      -- Match by extracting number from cabin ID and finding corresponding cabin
      cabin_number = COALESCE(
        (regexp_match(p_layout_cabin_id, '\d+$'))[1]::INTEGER,
        0
      )
    )
  LIMIT 1;
  
  RETURN cabin_uuid;
END;
$$;

-- Create trigger to auto-sync cabins when private hall layout is updated
CREATE OR REPLACE FUNCTION public.auto_sync_cabin_layout()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  cabin_mapping JSONB;
BEGIN
  -- Only sync if cabin_layout_json has changed and is not null
  IF NEW.cabin_layout_json IS NOT NULL AND 
     (OLD.cabin_layout_json IS NULL OR NEW.cabin_layout_json != OLD.cabin_layout_json) THEN
    
    -- Sync cabins with layout
    SELECT public.sync_private_hall_cabins(NEW.id, NEW.cabin_layout_json) 
    INTO cabin_mapping;
    
    RAISE LOG 'Synced cabins for private hall %: %', NEW.id, cabin_mapping;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger
DROP TRIGGER IF EXISTS trigger_auto_sync_cabin_layout ON public.private_halls;
CREATE TRIGGER trigger_auto_sync_cabin_layout
  AFTER INSERT OR UPDATE OF cabin_layout_json ON public.private_halls
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_sync_cabin_layout();