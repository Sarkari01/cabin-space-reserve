-- Add RLS policies for telemarketing executives to access bookings and transactions

-- Allow telemarketing executives to view all bookings
CREATE POLICY "Telemarketing executives can view all bookings" 
ON public.bookings 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM profiles 
  WHERE profiles.id = auth.uid() 
  AND profiles.role = 'telemarketing_executive'
));

-- Allow telemarketing executives to update bookings
CREATE POLICY "Telemarketing executives can update all bookings" 
ON public.bookings 
FOR UPDATE 
USING (EXISTS (
  SELECT 1 FROM profiles 
  WHERE profiles.id = auth.uid() 
  AND profiles.role = 'telemarketing_executive'
));

-- Allow telemarketing executives to view all transactions
CREATE POLICY "Telemarketing executives can view all transactions" 
ON public.transactions 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM profiles 
  WHERE profiles.id = auth.uid() 
  AND profiles.role = 'telemarketing_executive'
));

-- Allow telemarketing executives to update transactions
CREATE POLICY "Telemarketing executives can update all transactions" 
ON public.transactions 
FOR UPDATE 
USING (EXISTS (
  SELECT 1 FROM profiles 
  WHERE profiles.id = auth.uid() 
  AND profiles.role = 'telemarketing_executive'
));