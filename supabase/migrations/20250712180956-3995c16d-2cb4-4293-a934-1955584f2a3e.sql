-- Update business_settings RLS policy to allow read access for payment validation
-- while maintaining admin-only write access

-- Drop the existing restrictive policy
DROP POLICY IF EXISTS "Admin full access to business settings" ON public.business_settings;

-- Create separate policies for better granular control
-- Allow anyone to read business settings for payment validation
CREATE POLICY "Anyone can read business settings for payment validation" 
ON public.business_settings 
FOR SELECT 
USING (true);

-- Only admins can insert/update/delete business settings
CREATE POLICY "Admin can manage business settings" 
ON public.business_settings 
FOR ALL 
USING (is_admin()) 
WITH CHECK (is_admin());