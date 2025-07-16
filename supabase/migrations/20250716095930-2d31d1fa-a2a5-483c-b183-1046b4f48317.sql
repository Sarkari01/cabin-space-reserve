-- Update the set_news_creator function to handle institution posts better
CREATE OR REPLACE FUNCTION public.set_news_creator()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
DECLARE
  user_role text;
BEGIN
  -- Get the user's role
  SELECT role INTO user_role
  FROM public.profiles
  WHERE id = auth.uid();
  
  -- Set creator fields based on user role and institution context
  NEW.created_by := auth.uid();
  
  -- If institution_id is provided, prioritize institution type regardless of creator role
  IF NEW.institution_id IS NOT NULL THEN
    NEW.created_by_type := 'institution'::creator_type;
  ELSE
    -- Use user role for type when no institution is specified
    CASE user_role
      WHEN 'admin' THEN
        NEW.created_by_type := 'admin'::creator_type;
      WHEN 'institution' THEN
        NEW.created_by_type := 'institution'::creator_type;
      WHEN 'telemarketing_executive' THEN
        NEW.created_by_type := 'telemarketing_executive'::creator_type;
      ELSE
        NEW.created_by_type := 'admin'::creator_type;
    END CASE;
  END IF;
  
  RETURN NEW;
END;
$function$;