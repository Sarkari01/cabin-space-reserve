
-- Create security definer function to check if user is admin (avoids RLS recursion)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'
  );
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Add new RLS policy for admins to view all study halls
CREATE POLICY "Admins can view all study halls" 
ON public.study_halls 
FOR SELECT 
TO authenticated
USING (public.is_admin());

-- Update all existing study halls with 'pending' status to 'active'
UPDATE public.study_halls 
SET status = 'active' 
WHERE status = 'pending';

-- Ensure default status is 'active' (verify current setting)
ALTER TABLE public.study_halls 
ALTER COLUMN status SET DEFAULT 'active';

-- Add policy for admins to update any study hall status
CREATE POLICY "Admins can update any study hall" 
ON public.study_halls 
FOR UPDATE 
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());
