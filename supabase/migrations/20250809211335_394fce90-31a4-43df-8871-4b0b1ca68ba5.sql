-- Grant execute permissions for RLS-safe cabin availability functions
GRANT EXECUTE ON FUNCTION public.get_private_hall_cabin_availability(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.check_cabin_availability_for_dates(uuid, date, date) TO anon, authenticated;