-- Add refundable deposit column to cabins table
ALTER TABLE public.cabins 
ADD COLUMN refundable_deposit DECIMAL(10,2) DEFAULT 0.00;

-- Update cabin_bookings to track deposit separately
ALTER TABLE public.cabin_bookings 
ADD COLUMN deposit_amount DECIMAL(10,2) DEFAULT 0.00,
ADD COLUMN booking_amount DECIMAL(10,2) DEFAULT 0.00;

-- Create deposit_refunds table for tracking refunds
CREATE TABLE public.deposit_refunds (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  cabin_booking_id UUID NOT NULL REFERENCES public.cabin_bookings(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  merchant_id UUID NOT NULL,
  refund_amount DECIMAL(10,2) NOT NULL,
  refund_status TEXT NOT NULL DEFAULT 'pending' CHECK (refund_status IN ('pending', 'processing', 'completed', 'rejected')),
  refund_reason TEXT,
  requested_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  processed_at TIMESTAMP WITH TIME ZONE,
  processed_by UUID,
  payment_reference TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for deposit_refunds
ALTER TABLE public.deposit_refunds ENABLE ROW LEVEL SECURITY;

-- RLS policies for deposit_refunds
CREATE POLICY "Users can view their own deposit refunds"
  ON public.deposit_refunds 
  FOR SELECT 
  USING (user_id = auth.uid());

CREATE POLICY "Users can request deposit refunds for their bookings"
  ON public.deposit_refunds 
  FOR INSERT 
  WITH CHECK (
    user_id = auth.uid() AND 
    cabin_booking_id IN (
      SELECT id FROM public.cabin_bookings 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Merchants can view deposit refunds for their bookings"
  ON public.deposit_refunds 
  FOR SELECT 
  USING (
    merchant_id = auth.uid() OR
    cabin_booking_id IN (
      SELECT cb.id FROM public.cabin_bookings cb
      JOIN public.private_halls ph ON cb.private_hall_id = ph.id
      WHERE ph.merchant_id = auth.uid()
    )
  );

CREATE POLICY "Merchants can update deposit refunds for their bookings"
  ON public.deposit_refunds 
  FOR UPDATE 
  USING (
    cabin_booking_id IN (
      SELECT cb.id FROM public.cabin_bookings cb
      JOIN public.private_halls ph ON cb.private_hall_id = ph.id
      WHERE ph.merchant_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage all deposit refunds"
  ON public.deposit_refunds 
  FOR ALL 
  USING (is_admin())
  WITH CHECK (is_admin());

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION public.update_deposit_refunds_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_deposit_refunds_updated_at
  BEFORE UPDATE ON public.deposit_refunds
  FOR EACH ROW
  EXECUTE FUNCTION public.update_deposit_refunds_updated_at();

-- Update the cabin booking calculation to include deposit
CREATE OR REPLACE FUNCTION public.calculate_cabin_booking_with_deposit(
  p_cabin_id UUID,
  p_start_date DATE,
  p_end_date DATE,
  p_monthly_price DECIMAL
) RETURNS TABLE(
  months INTEGER,
  monthly_amount DECIMAL,
  booking_amount DECIMAL,
  deposit_amount DECIMAL,
  total_amount DECIMAL
) AS $$
DECLARE
  v_deposit DECIMAL;
  v_months INTEGER;
  v_monthly_amount DECIMAL;
  v_booking_amount DECIMAL;
BEGIN
  -- Get deposit amount for the cabin
  SELECT refundable_deposit INTO v_deposit
  FROM public.cabins 
  WHERE id = p_cabin_id;
  
  v_deposit := COALESCE(v_deposit, 0);
  
  -- Calculate months (round up)
  v_months := CEIL((p_end_date - p_start_date + 1)::DECIMAL / 30);
  
  -- Calculate amounts
  v_monthly_amount := p_monthly_price;
  v_booking_amount := v_months * v_monthly_amount;
  
  RETURN QUERY SELECT 
    v_months,
    v_monthly_amount,
    v_booking_amount,
    v_deposit,
    v_booking_amount + v_deposit;
END;
$$ LANGUAGE plpgsql STABLE;