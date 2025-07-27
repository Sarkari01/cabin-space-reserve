-- Create booking_period enum type
CREATE TYPE booking_period AS ENUM ('daily', 'weekly', 'monthly');

-- Add booking_period column to bookings table with default value
ALTER TABLE public.bookings 
ADD COLUMN booking_period booking_period DEFAULT 'monthly';

-- Update existing bookings to have proper booking_period values
-- Set booking_period based on date range duration
UPDATE public.bookings 
SET booking_period = CASE 
  WHEN (end_date - start_date + 1) <= 7 THEN 'daily'::booking_period
  WHEN (end_date - start_date + 1) <= 30 THEN 'weekly'::booking_period
  ELSE 'monthly'::booking_period
END
WHERE booking_period IS NULL;

-- Set NOT NULL constraint on booking_period
ALTER TABLE public.bookings 
ALTER COLUMN booking_period SET NOT NULL;