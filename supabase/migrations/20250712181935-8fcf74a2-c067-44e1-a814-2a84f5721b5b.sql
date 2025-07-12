-- Remove ekqr_api_key column from business_settings table
-- The API key is now stored securely in Supabase secrets as EKQR_API_KEY
ALTER TABLE public.business_settings DROP COLUMN IF EXISTS ekqr_api_key;