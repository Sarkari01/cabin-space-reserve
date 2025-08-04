-- Create cabin booking status enum
CREATE TYPE public.cabin_booking_status AS ENUM ('pending', 'active', 'completed', 'cancelled');

-- Create the cabin_bookings table
CREATE TABLE public.cabin_bookings (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    booking_number INTEGER,
    user_id UUID REFERENCES auth.users(id),
    cabin_id UUID NOT NULL REFERENCES public.cabins(id) ON DELETE CASCADE,
    private_hall_id UUID NOT NULL REFERENCES public.private_halls(id) ON DELETE CASCADE,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    months_booked INTEGER NOT NULL,
    monthly_amount NUMERIC NOT NULL,
    total_amount NUMERIC NOT NULL,
    status public.cabin_booking_status DEFAULT 'pending',
    payment_status TEXT DEFAULT 'unpaid',
    guest_name TEXT,
    guest_phone TEXT,
    guest_email TEXT,
    razorpay_order_id TEXT,
    razorpay_payment_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.cabin_bookings ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own cabin bookings" 
ON public.cabin_bookings 
FOR SELECT 
USING (user_id = auth.uid());

CREATE POLICY "Users can create their own cabin bookings" 
ON public.cabin_bookings 
FOR INSERT 
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Allow guest cabin bookings creation" 
ON public.cabin_bookings 
FOR INSERT 
WITH CHECK (
    (user_id = auth.uid()) OR 
    (user_id IS NULL AND guest_name IS NOT NULL AND guest_phone IS NOT NULL)
);

CREATE POLICY "Merchants can view cabin bookings for their private halls" 
ON public.cabin_bookings 
FOR SELECT 
USING (
    private_hall_id IN (
        SELECT id FROM public.private_halls 
        WHERE merchant_id = auth.uid()
    )
);

CREATE POLICY "Merchants can update cabin bookings for their private halls" 
ON public.cabin_bookings 
FOR UPDATE 
USING (
    private_hall_id IN (
        SELECT id FROM public.private_halls 
        WHERE merchant_id = auth.uid()
    )
);

CREATE POLICY "System can update cabin bookings for payment processing" 
ON public.cabin_bookings 
FOR UPDATE 
USING (true);

CREATE POLICY "Admins can manage all cabin bookings" 
ON public.cabin_bookings 
FOR ALL 
USING (is_admin())
WITH CHECK (is_admin());

-- Create trigger for auto-generating booking numbers
CREATE TRIGGER auto_generate_cabin_booking_number
    BEFORE INSERT ON public.cabin_bookings
    FOR EACH ROW
    EXECUTE FUNCTION public.auto_generate_cabin_booking_number();

-- Create trigger for handling cabin status updates
CREATE TRIGGER handle_cabin_booking_updates
    AFTER UPDATE ON public.cabin_bookings
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_cabin_booking_updates();

-- Create updated_at trigger
CREATE TRIGGER update_cabin_bookings_updated_at
    BEFORE UPDATE ON public.cabin_bookings
    FOR EACH ROW
    EXECUTE FUNCTION public.update_private_hall_cabin_count();