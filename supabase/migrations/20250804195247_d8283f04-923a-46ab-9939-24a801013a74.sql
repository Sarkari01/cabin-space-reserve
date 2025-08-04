-- Phase 1: Add missing Razorpay payment tracking columns to cabin_bookings table
ALTER TABLE public.cabin_bookings 
ADD COLUMN razorpay_order_id TEXT,
ADD COLUMN razorpay_payment_id TEXT;

-- Add indexes for better performance on payment queries
CREATE INDEX idx_cabin_bookings_razorpay_order_id ON public.cabin_bookings(razorpay_order_id);
CREATE INDEX idx_cabin_bookings_razorpay_payment_id ON public.cabin_bookings(razorpay_payment_id);

-- Phase 2: Update cabin booking trigger to handle payment status properly
CREATE OR REPLACE FUNCTION public.handle_cabin_booking_updates()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- When booking becomes active and paid, mark cabin as occupied
    IF NEW.status = 'active' AND NEW.payment_status = 'paid' AND OLD.status != 'active' THEN
        UPDATE public.cabins 
        SET status = 'occupied', updated_at = now()
        WHERE id = NEW.cabin_id;
        
        RAISE LOG 'Cabin % marked as occupied for booking %', NEW.cabin_id, NEW.id;
    END IF;
    
    -- When booking is completed or cancelled, mark cabin as available
    IF NEW.status IN ('completed', 'cancelled') AND OLD.status != NEW.status THEN
        UPDATE public.cabins 
        SET status = 'available', updated_at = now()
        WHERE id = NEW.cabin_id;
        
        RAISE LOG 'Cabin % marked as available for booking %', NEW.cabin_id, NEW.id;
    END IF;
    
    RETURN NEW;
END;
$$;

-- Ensure the trigger exists on cabin_bookings table
DROP TRIGGER IF EXISTS cabin_booking_updates_trigger ON public.cabin_bookings;
CREATE TRIGGER cabin_booking_updates_trigger
    AFTER UPDATE ON public.cabin_bookings
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_cabin_booking_updates();

-- Phase 3: Create RLS policy to allow guest bookings (when user_id is null)
CREATE POLICY "Allow guest cabin bookings creation" 
ON public.cabin_bookings 
FOR INSERT 
WITH CHECK (
    (user_id = auth.uid()) OR 
    (user_id IS NULL AND guest_name IS NOT NULL AND guest_phone IS NOT NULL)
);

-- Create policy for system/edge function updates
CREATE POLICY "System can update cabin bookings for payment processing" 
ON public.cabin_bookings 
FOR UPDATE 
USING (true);

-- Phase 4: Create function to check cabin availability
CREATE OR REPLACE FUNCTION public.check_cabin_availability_for_dates(
    p_cabin_id UUID,
    p_start_date DATE,
    p_end_date DATE,
    p_exclude_booking_id UUID DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE SECURITY DEFINER
AS $$
BEGIN
    RETURN NOT EXISTS (
        SELECT 1 
        FROM public.cabin_bookings 
        WHERE cabin_id = p_cabin_id 
          AND status IN ('active', 'pending')
          AND payment_status != 'failed'
          AND (p_exclude_booking_id IS NULL OR id != p_exclude_booking_id)
          AND (
              (start_date <= p_end_date AND end_date >= p_start_date)
          )
    );
END;
$$;