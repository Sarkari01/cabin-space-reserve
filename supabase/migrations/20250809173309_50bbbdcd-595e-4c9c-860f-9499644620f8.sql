-- Secure profiles table: restrict public access and allow user/admin scoped operations
BEGIN;

-- Ensure RLS is enabled
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Drop known overly-permissive public read policies if they exist
DROP POLICY IF EXISTS "Public can view profiles" ON public.profiles;
DROP POLICY IF EXISTS "Anyone can view profiles" ON public.profiles;
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;

-- Users: can view/update/insert only their own profile
CREATE POLICY "Users can view their own profile"
ON public.profiles
FOR SELECT
USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
ON public.profiles
FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
ON public.profiles
FOR INSERT
WITH CHECK (auth.uid() = id);

-- Admins: full management capabilities
CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
USING (is_admin());

CREATE POLICY "Admins can update any profile"
ON public.profiles
FOR UPDATE
USING (is_admin())
WITH CHECK (is_admin());

CREATE POLICY "Admins can insert profiles"
ON public.profiles
FOR INSERT
WITH CHECK (is_admin());

CREATE POLICY "Admins can delete profiles"
ON public.profiles
FOR DELETE
USING (is_admin());

COMMIT;