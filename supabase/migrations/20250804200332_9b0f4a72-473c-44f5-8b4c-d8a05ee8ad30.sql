-- Create the cabin_bookings table (enum already exists)
CREATE TABLE IF NOT EXISTS public.cabin_bookings (
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

-- Create RLS policies (using IF NOT EXISTS to avoid conflicts)
DO $$ 
BEGIN
    -- Users can view their own cabin bookings
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'cabin_bookings' 
        AND policyname = 'Users can view their own cabin bookings'
    ) THEN
        CREATE POLICY "Users can view their own cabin bookings" 
        ON public.cabin_bookings 
        FOR SELECT 
        USING (user_id = auth.uid());
    END IF;

    -- Users can create their own cabin bookings
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'cabin_bookings' 
        AND policyname = 'Users can create their own cabin bookings'
    ) THEN
        CREATE POLICY "Users can create their own cabin bookings" 
        ON public.cabin_bookings 
        FOR INSERT 
        WITH CHECK (user_id = auth.uid());
    END IF;

    -- Allow guest cabin bookings creation
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'cabin_bookings' 
        AND policyname = 'Allow guest cabin bookings creation'
    ) THEN
        CREATE POLICY "Allow guest cabin bookings creation" 
        ON public.cabin_bookings 
        FOR INSERT 
        WITH CHECK (
            (user_id = auth.uid()) OR 
            (user_id IS NULL AND guest_name IS NOT NULL AND guest_phone IS NOT NULL)
        );
    END IF;

    -- Merchants can view cabin bookings for their private halls
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'cabin_bookings' 
        AND policyname = 'Merchants can view cabin bookings for their private halls'
    ) THEN
        CREATE POLICY "Merchants can view cabin bookings for their private halls" 
        ON public.cabin_bookings 
        FOR SELECT 
        USING (
            private_hall_id IN (
                SELECT id FROM public.private_halls 
                WHERE merchant_id = auth.uid()
            )
        );
    END IF;

    -- Merchants can update cabin bookings for their private halls
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'cabin_bookings' 
        AND policyname = 'Merchants can update cabin bookings for their private halls'
    ) THEN
        CREATE POLICY "Merchants can update cabin bookings for their private halls" 
        ON public.cabin_bookings 
        FOR UPDATE 
        USING (
            private_hall_id IN (
                SELECT id FROM public.private_halls 
                WHERE merchant_id = auth.uid()
            )
        );
    END IF;

    -- System can update cabin bookings for payment processing
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'cabin_bookings' 
        AND policyname = 'System can update cabin bookings for payment processing'
    ) THEN
        CREATE POLICY "System can update cabin bookings for payment processing" 
        ON public.cabin_bookings 
        FOR UPDATE 
        USING (true);
    END IF;

    -- Admins can manage all cabin bookings
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'cabin_bookings' 
        AND policyname = 'Admins can manage all cabin bookings'
    ) THEN
        CREATE POLICY "Admins can manage all cabin bookings" 
        ON public.cabin_bookings 
        FOR ALL 
        USING (is_admin())
        WITH CHECK (is_admin());
    END IF;
END $$;

-- Create triggers (check if they don't already exist)
DO $$
BEGIN
    -- Auto-generate booking numbers trigger
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'auto_generate_cabin_booking_number' 
        AND tgrelid = 'public.cabin_bookings'::regclass
    ) THEN
        CREATE TRIGGER auto_generate_cabin_booking_number
            BEFORE INSERT ON public.cabin_bookings
            FOR EACH ROW
            EXECUTE FUNCTION public.auto_generate_cabin_booking_number();
    END IF;

    -- Handle cabin booking updates trigger
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'handle_cabin_booking_updates' 
        AND tgrelid = 'public.cabin_bookings'::regclass
    ) THEN
        CREATE TRIGGER handle_cabin_booking_updates
            AFTER UPDATE ON public.cabin_bookings
            FOR EACH ROW
            EXECUTE FUNCTION public.handle_cabin_booking_updates();
    END IF;
END $$;