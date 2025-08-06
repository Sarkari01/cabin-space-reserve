-- Enable real-time for cabin_bookings table
ALTER TABLE public.cabin_bookings REPLICA IDENTITY FULL;

-- Add cabin_bookings to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.cabin_bookings;