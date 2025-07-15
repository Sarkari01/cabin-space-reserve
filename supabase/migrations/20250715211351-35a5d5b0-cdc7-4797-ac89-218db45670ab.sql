-- Update generate_short_id function to generate 5-6 digit numbers (10000-999999)
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
        -- Generate random 5-6 digit number (10000 to 999999)
        new_id := floor(random() * 990000 + 10000)::integer;
        
        -- Check if this ID already exists in the specified table
        EXECUTE format('SELECT 1 FROM %I WHERE %I = $1', table_name, column_name) 
        USING new_id;
        
        IF NOT FOUND THEN
            RETURN new_id;
        END IF;
        
        attempt_count := attempt_count + 1;
        IF attempt_count >= max_attempts THEN
            RAISE EXCEPTION 'Unable to generate unique 5-6 digit ID after % attempts', max_attempts;
        END IF;
    END LOOP;
END;
$function$;

-- Add student_number column to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS student_number integer;

-- Create trigger function for auto-generating student numbers
CREATE OR REPLACE FUNCTION public.auto_generate_student_number()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    IF NEW.student_number IS NULL AND NEW.role = 'student' THEN
        NEW.student_number := generate_short_id('profiles', 'student_number');
    END IF;
    RETURN NEW;
END;
$function$;

-- Create trigger for student number generation
DROP TRIGGER IF EXISTS auto_generate_student_number_trigger ON profiles;
CREATE TRIGGER auto_generate_student_number_trigger
    BEFORE INSERT OR UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION auto_generate_student_number();

-- Generate student numbers for existing students
UPDATE profiles 
SET student_number = generate_short_id('profiles', 'student_number')
WHERE role = 'student' AND student_number IS NULL;