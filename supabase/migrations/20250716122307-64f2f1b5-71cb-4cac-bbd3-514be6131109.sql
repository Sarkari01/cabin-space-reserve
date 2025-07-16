-- Add copyright_text field to business_settings table
ALTER TABLE public.business_settings 
ADD COLUMN copyright_text TEXT;