-- Step 1: Add cabin_booking_id to transactions table
ALTER TABLE public.transactions 
ADD COLUMN cabin_booking_id UUID REFERENCES public.cabin_bookings(id) ON DELETE SET NULL;

-- Step 2: Create index for better performance
CREATE INDEX idx_transactions_cabin_booking_id ON public.transactions(cabin_booking_id);

-- Step 3: Update RLS policies to handle cabin booking transactions
DROP POLICY IF EXISTS "Merchants can view transactions for their bookings" ON public.transactions;

CREATE POLICY "Merchants can view transactions for their bookings" ON public.transactions
FOR SELECT
USING (
  -- Regular study hall bookings
  (booking_id IN (
    SELECT b.id FROM bookings b
    JOIN study_halls sh ON b.study_hall_id = sh.id
    WHERE sh.merchant_id = auth.uid()
  ))
  OR
  -- Cabin bookings
  (cabin_booking_id IN (
    SELECT cb.id FROM cabin_bookings cb
    JOIN private_halls ph ON cb.private_hall_id = ph.id
    WHERE ph.merchant_id = auth.uid()
  ))
);

-- Step 4: Create a function to create cabin booking transactions
CREATE OR REPLACE FUNCTION public.create_cabin_booking_transaction(
  p_cabin_booking_id UUID,
  p_user_id UUID,
  p_amount NUMERIC,
  p_payment_method TEXT,
  p_payment_id TEXT DEFAULT NULL,
  p_payment_data JSONB DEFAULT NULL
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  transaction_id UUID;
BEGIN
  INSERT INTO public.transactions (
    cabin_booking_id,
    user_id,
    amount,
    payment_method,
    payment_id,
    payment_data,
    status
  ) VALUES (
    p_cabin_booking_id,
    p_user_id,
    p_amount,
    p_payment_method,
    p_payment_id,
    COALESCE(p_payment_data, jsonb_build_object('booking_type', 'cabin')),
    'pending'
  )
  RETURNING id INTO transaction_id;
  
  RETURN transaction_id;
END;
$$;

-- Step 5: Backfill missing transactions for existing paid cabin bookings
INSERT INTO public.transactions (
  cabin_booking_id,
  user_id,
  amount,
  payment_method,
  payment_id,
  payment_data,
  status,
  created_at,
  updated_at
)
SELECT 
  cb.id,
  cb.user_id,
  cb.total_amount,
  'razorpay',
  cb.razorpay_payment_id,
  jsonb_build_object(
    'booking_type', 'cabin',
    'razorpay_order_id', cb.razorpay_order_id,
    'razorpay_payment_id', cb.razorpay_payment_id
  ),
  'completed',
  cb.created_at,
  cb.updated_at
FROM public.cabin_bookings cb
WHERE cb.payment_status = 'paid'
  AND cb.razorpay_payment_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.transactions t 
    WHERE t.cabin_booking_id = cb.id
  );

-- Step 6: Create trigger to auto-create transactions for cabin bookings
CREATE OR REPLACE FUNCTION public.handle_cabin_booking_payment()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- When a cabin booking is marked as paid, create/update the transaction
  IF NEW.payment_status = 'paid' AND OLD.payment_status != 'paid' THEN
    -- Check if transaction already exists
    IF NOT EXISTS (
      SELECT 1 FROM public.transactions 
      WHERE cabin_booking_id = NEW.id
    ) THEN
      -- Create new transaction
      INSERT INTO public.transactions (
        cabin_booking_id,
        user_id,
        amount,
        payment_method,
        payment_id,
        payment_data,
        status
      ) VALUES (
        NEW.id,
        NEW.user_id,
        NEW.total_amount,
        'razorpay',
        NEW.razorpay_payment_id,
        jsonb_build_object(
          'booking_type', 'cabin',
          'razorpay_order_id', NEW.razorpay_order_id,
          'razorpay_payment_id', NEW.razorpay_payment_id
        ),
        'completed'
      );
    ELSE
      -- Update existing transaction
      UPDATE public.transactions 
      SET 
        status = 'completed',
        payment_id = NEW.razorpay_payment_id,
        payment_data = jsonb_build_object(
          'booking_type', 'cabin',
          'razorpay_order_id', NEW.razorpay_order_id,
          'razorpay_payment_id', NEW.razorpay_payment_id
        ),
        updated_at = now()
      WHERE cabin_booking_id = NEW.id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create the trigger
DROP TRIGGER IF EXISTS cabin_booking_payment_trigger ON public.cabin_bookings;
CREATE TRIGGER cabin_booking_payment_trigger
  AFTER UPDATE ON public.cabin_bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_cabin_booking_payment();