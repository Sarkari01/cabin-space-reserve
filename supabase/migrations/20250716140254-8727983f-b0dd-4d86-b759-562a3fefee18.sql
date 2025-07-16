-- Fix the manage-api-keys edge function by using a simpler approach
-- We'll store API keys directly in the database as a fallback method since the Management API is failing

-- Create a secure table for storing API keys as an alternative to secrets
CREATE TABLE IF NOT EXISTS public.api_keys_vault (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key_name TEXT UNIQUE NOT NULL,
  key_value_encrypted TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.api_keys_vault ENABLE ROW LEVEL SECURITY;

-- Only admins can access the vault
CREATE POLICY "Only admins can manage API keys vault" 
ON public.api_keys_vault 
FOR ALL 
USING (is_admin())
WITH CHECK (is_admin());