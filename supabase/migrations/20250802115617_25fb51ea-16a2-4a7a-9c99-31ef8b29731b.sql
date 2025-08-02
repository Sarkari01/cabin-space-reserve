-- Create enum for private hall status
CREATE TYPE private_hall_status AS ENUM ('active', 'inactive', 'draft');

-- Create enum for cabin status  
CREATE TYPE cabin_status AS ENUM ('available', 'occupied', 'maintenance');

-- Create enum for cabin booking status
CREATE TYPE cabin_booking_status AS ENUM ('active', 'completed', 'cancelled', 'pending');

-- Create private_halls table
CREATE TABLE public.private_halls (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    merchant_id UUID NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    location TEXT NOT NULL,
    formatted_address TEXT,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    monthly_price NUMERIC(10,2) NOT NULL,
    cabin_layout_json JSONB DEFAULT '{}',
    cabin_count INTEGER DEFAULT 0,
    total_revenue NUMERIC(15,2) DEFAULT 0,
    status private_hall_status DEFAULT 'draft',
    amenities TEXT[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create cabins table
CREATE TABLE public.cabins (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    private_hall_id UUID NOT NULL REFERENCES public.private_halls(id) ON DELETE CASCADE,
    cabin_number INTEGER NOT NULL,
    cabin_name TEXT NOT NULL,
    monthly_price NUMERIC(10,2),
    size_sqft INTEGER,
    max_occupancy INTEGER DEFAULT 1,
    amenities TEXT[] DEFAULT '{}',
    position_x INTEGER DEFAULT 0,
    position_y INTEGER DEFAULT 0,
    status cabin_status DEFAULT 'available',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(private_hall_id, cabin_number)
);

-- Create cabin_bookings table
CREATE TABLE public.cabin_bookings (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    booking_number INTEGER,
    user_id UUID,
    cabin_id UUID NOT NULL REFERENCES public.cabins(id) ON DELETE CASCADE,
    private_hall_id UUID NOT NULL REFERENCES public.private_halls(id) ON DELETE CASCADE,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    months_booked INTEGER NOT NULL,
    monthly_amount NUMERIC(10,2) NOT NULL,
    total_amount NUMERIC(10,2) NOT NULL,
    payment_status TEXT DEFAULT 'unpaid',
    status cabin_booking_status DEFAULT 'pending',
    guest_name TEXT,
    guest_phone TEXT,
    guest_email TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create private_hall_images table
CREATE TABLE public.private_hall_images (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    private_hall_id UUID NOT NULL REFERENCES public.private_halls(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    file_path TEXT NOT NULL,
    is_main BOOLEAN DEFAULT false,
    display_order INTEGER DEFAULT 0,
    file_size INTEGER,
    mime_type TEXT,
    uploaded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.private_halls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cabins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cabin_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.private_hall_images ENABLE ROW LEVEL SECURITY;

-- RLS Policies for private_halls
CREATE POLICY "Admins can manage all private halls" 
ON public.private_halls FOR ALL 
TO authenticated 
USING (is_admin())
WITH CHECK (is_admin());

CREATE POLICY "Merchants can manage their own private halls" 
ON public.private_halls FOR ALL 
TO authenticated 
USING (merchant_id = auth.uid())
WITH CHECK (merchant_id = auth.uid());

CREATE POLICY "Anyone can view active private halls" 
ON public.private_halls FOR SELECT 
TO authenticated 
USING (status = 'active');

-- RLS Policies for cabins
CREATE POLICY "Admins can manage all cabins" 
ON public.cabins FOR ALL 
TO authenticated 
USING (is_admin())
WITH CHECK (is_admin());

CREATE POLICY "Merchants can manage cabins in their private halls" 
ON public.cabins FOR ALL 
TO authenticated 
USING (private_hall_id IN (
    SELECT id FROM public.private_halls WHERE merchant_id = auth.uid()
))
WITH CHECK (private_hall_id IN (
    SELECT id FROM public.private_halls WHERE merchant_id = auth.uid()
));

CREATE POLICY "Anyone can view cabins in active private halls" 
ON public.cabins FOR SELECT 
TO authenticated 
USING (private_hall_id IN (
    SELECT id FROM public.private_halls WHERE status = 'active'
));

-- RLS Policies for cabin_bookings
CREATE POLICY "Admins can manage all cabin bookings" 
ON public.cabin_bookings FOR ALL 
TO authenticated 
USING (is_admin())
WITH CHECK (is_admin());

CREATE POLICY "Users can view their own cabin bookings" 
ON public.cabin_bookings FOR SELECT 
TO authenticated 
USING (user_id = auth.uid());

CREATE POLICY "Users can create their own cabin bookings" 
ON public.cabin_bookings FOR INSERT 
TO authenticated 
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Merchants can view cabin bookings for their private halls" 
ON public.cabin_bookings FOR SELECT 
TO authenticated 
USING (private_hall_id IN (
    SELECT id FROM public.private_halls WHERE merchant_id = auth.uid()
));

CREATE POLICY "Merchants can update cabin bookings for their private halls" 
ON public.cabin_bookings FOR UPDATE 
TO authenticated 
USING (private_hall_id IN (
    SELECT id FROM public.private_halls WHERE merchant_id = auth.uid()
));

-- RLS Policies for private_hall_images
CREATE POLICY "Admins can manage all private hall images" 
ON public.private_hall_images FOR ALL 
TO authenticated 
USING (is_admin())
WITH CHECK (is_admin());

CREATE POLICY "Merchants can manage images for their private halls" 
ON public.private_hall_images FOR ALL 
TO authenticated 
USING (private_hall_id IN (
    SELECT id FROM public.private_halls WHERE merchant_id = auth.uid()
))
WITH CHECK (private_hall_id IN (
    SELECT id FROM public.private_halls WHERE merchant_id = auth.uid()
));

CREATE POLICY "Anyone can view private hall images" 
ON public.private_hall_images FOR SELECT 
TO authenticated 
USING (true);

-- Auto-generate booking numbers
CREATE OR REPLACE FUNCTION public.auto_generate_cabin_booking_number()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.booking_number IS NULL THEN
        NEW.booking_number := public.generate_short_id('cabin_bookings', 'booking_number');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER cabin_booking_number_trigger
    BEFORE INSERT ON public.cabin_bookings
    FOR EACH ROW
    EXECUTE FUNCTION public.auto_generate_cabin_booking_number();

-- Function to update private hall cabin count
CREATE OR REPLACE FUNCTION public.update_private_hall_cabin_count()
RETURNS TRIGGER AS $$
BEGIN
    -- Update cabin count for the private hall
    UPDATE public.private_halls 
    SET cabin_count = (
        SELECT COUNT(*) FROM public.cabins 
        WHERE private_hall_id = COALESCE(NEW.private_hall_id, OLD.private_hall_id)
    ),
    updated_at = now()
    WHERE id = COALESCE(NEW.private_hall_id, OLD.private_hall_id);
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER update_cabin_count_trigger
    AFTER INSERT OR DELETE ON public.cabins
    FOR EACH ROW
    EXECUTE FUNCTION public.update_private_hall_cabin_count();

-- Function to handle cabin booking updates
CREATE OR REPLACE FUNCTION public.handle_cabin_booking_updates()
RETURNS TRIGGER AS $$
BEGIN
    -- When booking becomes active, mark cabin as occupied
    IF NEW.status = 'active' AND NEW.payment_status = 'paid' AND OLD.status != 'active' THEN
        UPDATE public.cabins 
        SET status = 'occupied'
        WHERE id = NEW.cabin_id;
    END IF;
    
    -- When booking is completed or cancelled, mark cabin as available
    IF NEW.status IN ('completed', 'cancelled') AND OLD.status != NEW.status THEN
        UPDATE public.cabins 
        SET status = 'available'
        WHERE id = NEW.cabin_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER cabin_booking_updates_trigger
    AFTER UPDATE ON public.cabin_bookings
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_cabin_booking_updates();