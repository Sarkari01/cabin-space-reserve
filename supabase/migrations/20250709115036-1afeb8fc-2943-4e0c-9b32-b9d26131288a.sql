-- Fix the booking status constraint to include all valid statuses
ALTER TABLE public.bookings 
DROP CONSTRAINT IF EXISTS bookings_status_check;

ALTER TABLE public.bookings 
ADD CONSTRAINT bookings_status_check 
CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed', 'refunded', 'active', 'expired'));

-- Enable real-time replication for layout sync
ALTER TABLE public.study_halls REPLICA IDENTITY FULL;
ALTER TABLE public.seats REPLICA IDENTITY FULL;
ALTER TABLE public.bookings REPLICA IDENTITY FULL;

-- Add tables to realtime publication for instant updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.study_halls;
ALTER PUBLICATION supabase_realtime ADD TABLE public.seats;
ALTER PUBLICATION supabase_realtime ADD TABLE public.bookings;