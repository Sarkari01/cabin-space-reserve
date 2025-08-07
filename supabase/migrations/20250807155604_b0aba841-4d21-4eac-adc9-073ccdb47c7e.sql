-- Remove the complex deposit_refunds table and its policies
DROP TABLE IF EXISTS public.deposit_refunds CASCADE;

-- Add simple deposit_refunded column to cabin_bookings
ALTER TABLE public.cabin_bookings 
ADD COLUMN IF NOT EXISTS deposit_refunded BOOLEAN DEFAULT false;

-- Update the cabin_bookings table to ensure we have the necessary columns
-- (refundable_deposit column in cabins should already exist from previous migration)