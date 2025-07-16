-- Add business_address field to business_settings table
ALTER TABLE public.business_settings 
ADD COLUMN business_address TEXT;