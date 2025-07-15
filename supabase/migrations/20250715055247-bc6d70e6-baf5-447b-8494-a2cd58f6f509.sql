-- Add missing RLS policy for merchants to update bookings in their study halls
CREATE POLICY "Merchants can update bookings for their study halls" 
ON public.bookings 
FOR UPDATE 
TO authenticated
USING (study_hall_id IN ( 
  SELECT study_halls.id
  FROM study_halls
  WHERE study_halls.merchant_id = auth.uid()
))
WITH CHECK (study_hall_id IN ( 
  SELECT study_halls.id
  FROM study_halls
  WHERE study_halls.merchant_id = auth.uid()
));