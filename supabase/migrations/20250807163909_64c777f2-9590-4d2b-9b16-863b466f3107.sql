-- Add deposit tracking fields to transactions table
ALTER TABLE public.transactions 
ADD COLUMN IF NOT EXISTS deposit_amount numeric DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS booking_amount numeric DEFAULT 0.00;