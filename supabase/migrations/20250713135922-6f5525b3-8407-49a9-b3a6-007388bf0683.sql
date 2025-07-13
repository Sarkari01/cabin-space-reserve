-- Add missing admin RLS policies for full data access

-- Add admin policy for bookings table
CREATE POLICY "Admins can view and manage all bookings" 
ON public.bookings 
FOR ALL 
TO authenticated
USING (is_admin())
WITH CHECK (is_admin());

-- Verify admin policy exists for transactions (add if missing)
DROP POLICY IF EXISTS "Admin can view all transactions" ON public.transactions;
DROP POLICY IF EXISTS "Admin can update transaction status" ON public.transactions;

CREATE POLICY "Admins can view and manage all transactions" 
ON public.transactions 
FOR ALL 
TO authenticated
USING (is_admin())
WITH CHECK (is_admin());

-- Ensure admin can manage profiles 
CREATE POLICY "Admins can manage all profiles" 
ON public.profiles 
FOR ALL 
TO authenticated
USING (is_admin())
WITH CHECK (is_admin());

-- Ensure admin can manage study halls
-- (This should already exist but let's verify)
CREATE POLICY "Admins can manage all study_halls" 
ON public.study_halls 
FOR ALL 
TO authenticated
USING (is_admin())
WITH CHECK (is_admin());

-- Ensure admin can manage seats
CREATE POLICY "Admins can manage all seats" 
ON public.seats 
FOR ALL 
TO authenticated
USING (is_admin())
WITH CHECK (is_admin());