-- Add database triggers for real-time booking updates (fixed version)
-- This will ensure that any booking changes trigger real-time notifications

-- Enable realtime for tables if not already enabled
ALTER TABLE public.bookings REPLICA IDENTITY FULL;
ALTER TABLE public.transactions REPLICA IDENTITY FULL;
ALTER TABLE public.seats REPLICA IDENTITY FULL;

-- Create function to handle booking status updates
CREATE OR REPLACE FUNCTION public.handle_booking_updates()
RETURNS TRIGGER AS $$
BEGIN
  -- Log the booking update
  RAISE LOG 'Booking update detected: % -> %', OLD.status, NEW.status;
  
  -- If booking is confirmed, ensure seat is marked unavailable
  IF NEW.status = 'active' AND NEW.payment_status = 'paid' THEN
    UPDATE public.seats 
    SET is_available = false 
    WHERE id = NEW.seat_id AND is_available = true;
  END IF;
  
  -- If booking is cancelled, free up the seat
  IF NEW.status = 'cancelled' THEN
    UPDATE public.seats 
    SET is_available = true 
    WHERE id = NEW.seat_id AND is_available = false;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for booking updates
DROP TRIGGER IF EXISTS trigger_booking_updates ON public.bookings;
CREATE TRIGGER trigger_booking_updates
  AFTER UPDATE ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_booking_updates();

-- Create function to handle transaction status updates
CREATE OR REPLACE FUNCTION public.handle_transaction_updates()
RETURNS TRIGGER AS $$
BEGIN
  -- Log the transaction update
  RAISE LOG 'Transaction update detected: % -> %', OLD.status, NEW.status;
  
  -- When transaction becomes completed, ensure booking is properly linked
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    -- Update associated booking payment status
    UPDATE public.bookings 
    SET payment_status = 'paid', 
        status = 'active',
        updated_at = now()
    WHERE id = NEW.booking_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for transaction updates
DROP TRIGGER IF EXISTS trigger_transaction_updates ON public.transactions;
CREATE TRIGGER trigger_transaction_updates
  AFTER UPDATE ON public.transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_transaction_updates();