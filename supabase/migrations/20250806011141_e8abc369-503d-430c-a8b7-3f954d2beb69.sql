-- First, fix the user ID mismatch for existing cabin booking
UPDATE cabin_bookings 
SET user_id = (
  SELECT id FROM profiles 
  WHERE email LIKE '%duudsk%' 
  AND id::text ILIKE 'b2866606%'
  LIMIT 1
)
WHERE booking_number = 945287;

-- Create function to automatically create transactions for cabin bookings
CREATE OR REPLACE FUNCTION public.create_cabin_booking_transaction()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Only create transaction if booking has a user and payment details
  IF NEW.payment_status = 'paid' AND NEW.user_id IS NOT NULL THEN
    INSERT INTO public.transactions (
      booking_id,
      user_id,
      amount,
      payment_method,
      payment_id,
      status,
      payment_data
    ) VALUES (
      NEW.id,
      NEW.user_id,
      NEW.total_amount,
      CASE 
        WHEN NEW.razorpay_payment_id IS NOT NULL THEN 'razorpay'
        ELSE 'unknown'
      END,
      COALESCE(NEW.razorpay_payment_id, NEW.razorpay_order_id),
      CASE NEW.payment_status
        WHEN 'paid' THEN 'completed'
        WHEN 'failed' THEN 'failed'
        ELSE 'pending'
      END,
      jsonb_build_object(
        'razorpay_order_id', NEW.razorpay_order_id,
        'razorpay_payment_id', NEW.razorpay_payment_id,
        'booking_type', 'cabin_booking'
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for cabin booking transactions
DROP TRIGGER IF EXISTS create_cabin_booking_transaction_trigger ON cabin_bookings;
CREATE TRIGGER create_cabin_booking_transaction_trigger
  AFTER INSERT OR UPDATE ON cabin_bookings
  FOR EACH ROW
  EXECUTE FUNCTION create_cabin_booking_transaction();

-- Create transactions for existing paid cabin bookings that don't have transactions
INSERT INTO public.transactions (
  booking_id,
  user_id,
  amount,
  payment_method,
  payment_id,
  status,
  payment_data,
  created_at
)
SELECT 
  cb.id,
  cb.user_id,
  cb.total_amount,
  'razorpay',
  COALESCE(cb.razorpay_payment_id, cb.razorpay_order_id),
  'completed',
  jsonb_build_object(
    'razorpay_order_id', cb.razorpay_order_id,
    'razorpay_payment_id', cb.razorpay_payment_id,
    'booking_type', 'cabin_booking'
  ),
  cb.updated_at
FROM cabin_bookings cb
WHERE cb.payment_status = 'paid' 
  AND cb.user_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM transactions t 
    WHERE t.booking_id = cb.id
  );