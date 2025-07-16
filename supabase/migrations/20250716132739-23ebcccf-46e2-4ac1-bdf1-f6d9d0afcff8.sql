-- Add Gemini AI settings to business_settings table
ALTER TABLE public.business_settings 
ADD COLUMN gemini_api_key_preview text,
ADD COLUMN gemini_enabled boolean DEFAULT false;