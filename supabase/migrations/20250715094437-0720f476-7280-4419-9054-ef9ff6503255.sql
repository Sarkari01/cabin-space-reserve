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