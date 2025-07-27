-- Add booking_period column to bookings table with correct default value
ALTER TABLE public.bookings 
ADD COLUMN booking_period booking_period DEFAULT '1_month';

-- Update existing bookings to have proper booking_period values
-- Set booking_period based on date range duration using correct enum values
UPDATE public.bookings 
SET booking_period = CASE 
  WHEN (end_date - start_date + 1) <= 30 THEN '1_month'::booking_period
  WHEN (end_date - start_date + 1) <= 60 THEN '2_months'::booking_period
  WHEN (end_date - start_date + 1) <= 90 THEN '3_months'::booking_period
  WHEN (end_date - start_date + 1) <= 180 THEN '6_months'::booking_period
  ELSE '12_months'::booking_period
END
WHERE booking_period IS NULL;

-- Set NOT NULL constraint on booking_period
ALTER TABLE public.bookings 
ALTER COLUMN booking_period SET NOT NULL;