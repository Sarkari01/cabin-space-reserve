-- Fix the generate_short_id function to use proper schema qualification
CREATE OR REPLACE FUNCTION public.generate_short_id(table_name text, column_name text)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    new_id integer;
    max_attempts integer := 100;
    attempt_count integer := 0;
    query_text text;
    id_exists boolean;
BEGIN
    LOOP
        -- Generate random 5-6 digit number (10000 to 999999)
        new_id := floor(random() * 990000 + 10000)::integer;
        
        -- Build query with proper schema qualification
        query_text := format('SELECT EXISTS(SELECT 1 FROM public.%I WHERE %I = $1)', table_name, column_name);
        
        -- Execute the query to check if ID exists
        EXECUTE query_text USING new_id INTO id_exists;
        
        -- If ID doesn't exist, return it
        IF NOT id_exists THEN
            RETURN new_id;
        END IF;
        
        attempt_count := attempt_count + 1;
        IF attempt_count >= max_attempts THEN
            RAISE EXCEPTION 'Unable to generate unique 5-6 digit ID after % attempts for table %.%', max_attempts, table_name, column_name;
        END IF;
    END LOOP;
END;
$function$;