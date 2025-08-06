-- Create or replace the cabin ID mapping function to properly map layout IDs to database UUIDs
CREATE OR REPLACE FUNCTION public.get_cabin_id_mapping(p_private_hall_id uuid, p_layout_cabin_id text)
RETURNS uuid
LANGUAGE plpgsql
STABLE SECURITY DEFINER
AS $function$
DECLARE
  cabin_uuid UUID;
  cabin_name_to_find TEXT;
BEGIN
  -- Extract cabin name from layout cabin ID
  -- Layout IDs are like 'cabin-1', 'cabin-2', etc.
  -- We need to map them to actual cabin names like 'A1', 'A2', etc.
  
  -- First try direct cabin name match (if layout uses actual cabin names)
  SELECT id INTO cabin_uuid
  FROM public.cabins
  WHERE private_hall_id = p_private_hall_id
    AND cabin_name = p_layout_cabin_id
  LIMIT 1;
  
  -- If no direct match, try extracting number and finding by cabin number
  IF cabin_uuid IS NULL THEN
    DECLARE
      cabin_num INTEGER;
    BEGIN
      -- Extract number from layout cabin ID (e.g., 'cabin-1' -> 1)
      cabin_num := COALESCE(
        (regexp_match(p_layout_cabin_id, 'cabin-(\d+)$'))[1]::INTEGER,
        (regexp_match(p_layout_cabin_id, '\d+$'))[1]::INTEGER,
        0
      );
      
      -- Find cabin by number
      SELECT id INTO cabin_uuid
      FROM public.cabins
      WHERE private_hall_id = p_private_hall_id
        AND cabin_number = cabin_num
      LIMIT 1;
    END;
  END IF;
  
  -- If still no match, try by ordinal position (fallback)
  IF cabin_uuid IS NULL THEN
    DECLARE
      position_num INTEGER;
    BEGIN
      position_num := COALESCE(
        (regexp_match(p_layout_cabin_id, 'cabin-(\d+)$'))[1]::INTEGER,
        1
      );
      
      SELECT id INTO cabin_uuid
      FROM (
        SELECT id, ROW_NUMBER() OVER (ORDER BY cabin_number) as rn
        FROM public.cabins
        WHERE private_hall_id = p_private_hall_id
      ) numbered_cabins
      WHERE rn = position_num;
    END;
  END IF;
  
  RETURN cabin_uuid;
END;
$function$;