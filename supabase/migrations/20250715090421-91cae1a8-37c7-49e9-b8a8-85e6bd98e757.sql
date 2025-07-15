-- Enable realtime for critical tables (only ones not already enabled)
DO $$
BEGIN
  -- Only add tables to realtime publication if they aren't already there
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.seats;
  EXCEPTION
    WHEN duplicate_object THEN
      NULL; -- Table already in publication, ignore
  END;
  
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.transactions;
  EXCEPTION
    WHEN duplicate_object THEN
      NULL; -- Table already in publication, ignore
  END;
  
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.study_halls;
  EXCEPTION
    WHEN duplicate_object THEN
      NULL; -- Table already in publication, ignore
  END;
END $$;

-- Ensure REPLICA IDENTITY FULL for real-time updates
ALTER TABLE public.bookings REPLICA IDENTITY FULL;
ALTER TABLE public.seats REPLICA IDENTITY FULL;
ALTER TABLE public.transactions REPLICA IDENTITY FULL;
ALTER TABLE public.study_halls REPLICA IDENTITY FULL;