-- Add foreign key constraints for cabin_bookings table
ALTER TABLE public.cabin_bookings 
ADD CONSTRAINT fk_cabin_bookings_cabin_id 
FOREIGN KEY (cabin_id) REFERENCES public.cabins(id) ON DELETE CASCADE;

ALTER TABLE public.cabin_bookings 
ADD CONSTRAINT fk_cabin_bookings_private_hall_id 
FOREIGN KEY (private_hall_id) REFERENCES public.private_halls(id) ON DELETE CASCADE;

-- Enable RLS on cabin_bookings table
ALTER TABLE public.cabin_bookings ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for cabin_bookings table
CREATE POLICY "Users can view their own cabin bookings" 
ON public.cabin_bookings 
FOR SELECT 
USING (user_id = auth.uid());

CREATE POLICY "Users can create their own cabin bookings" 
ON public.cabin_bookings 
FOR INSERT 
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own cabin bookings" 
ON public.cabin_bookings 
FOR UPDATE 
USING (user_id = auth.uid());

CREATE POLICY "Merchants can view cabin bookings for their private halls" 
ON public.cabin_bookings 
FOR SELECT 
USING (private_hall_id IN (
  SELECT id FROM public.private_halls 
  WHERE merchant_id = auth.uid()
));

CREATE POLICY "Merchants can update cabin bookings for their private halls" 
ON public.cabin_bookings 
FOR UPDATE 
USING (private_hall_id IN (
  SELECT id FROM public.private_halls 
  WHERE merchant_id = auth.uid()
));

CREATE POLICY "Admins can manage all cabin bookings" 
ON public.cabin_bookings 
FOR ALL 
USING (is_admin());

CREATE POLICY "Allow guest cabin bookings creation" 
ON public.cabin_bookings 
FOR INSERT 
WITH CHECK (
  (user_id = auth.uid()) OR 
  (user_id IS NULL AND guest_name IS NOT NULL AND guest_phone IS NOT NULL)
);

CREATE POLICY "System can update cabin bookings for payment processing" 
ON public.cabin_bookings 
FOR UPDATE 
USING (true);