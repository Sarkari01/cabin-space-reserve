-- First, let's check if foreign key constraints exist and add them if missing
-- We'll use conditional logic to avoid errors

-- Add foreign key constraints if they don't exist
DO $$
BEGIN
    -- Check and add cabin_id foreign key
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_cabin_bookings_cabin_id'
        AND table_name = 'cabin_bookings'
    ) THEN
        ALTER TABLE public.cabin_bookings 
        ADD CONSTRAINT fk_cabin_bookings_cabin_id 
        FOREIGN KEY (cabin_id) REFERENCES public.cabins(id) ON DELETE CASCADE;
    END IF;

    -- Check and add private_hall_id foreign key
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_cabin_bookings_private_hall_id'
        AND table_name = 'cabin_bookings'
    ) THEN
        ALTER TABLE public.cabin_bookings 
        ADD CONSTRAINT fk_cabin_bookings_private_hall_id 
        FOREIGN KEY (private_hall_id) REFERENCES public.private_halls(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Enable RLS on cabin_bookings table (this is idempotent)
ALTER TABLE public.cabin_bookings ENABLE ROW LEVEL SECURITY;