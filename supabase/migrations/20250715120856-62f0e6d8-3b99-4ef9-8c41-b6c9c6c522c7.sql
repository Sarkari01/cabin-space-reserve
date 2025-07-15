-- Create settlements table for settlement batches
CREATE TABLE public.settlements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  settlement_number INTEGER NOT NULL UNIQUE,
  admin_id UUID NOT NULL REFERENCES auth.users(id),
  merchant_id UUID NOT NULL REFERENCES public.profiles(id),
  total_booking_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  platform_fee_percentage DECIMAL(5,2) NOT NULL DEFAULT 0,
  platform_fee_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  net_settlement_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'paid')),
  payment_reference TEXT,
  payment_method TEXT,
  payment_date TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create settlement_transactions table for tracking which transactions are in which settlement
CREATE TABLE public.settlement_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  settlement_id UUID NOT NULL REFERENCES public.settlements(id) ON DELETE CASCADE,
  transaction_id UUID NOT NULL REFERENCES public.transactions(id),
  booking_id UUID NOT NULL REFERENCES public.bookings(id),
  transaction_amount DECIMAL(12,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(transaction_id) -- Ensure each transaction can only be settled once
);

-- Add platform fee settings to business_settings table
ALTER TABLE public.business_settings 
ADD COLUMN platform_fee_percentage DECIMAL(5,2) DEFAULT 10.00,
ADD COLUMN minimum_settlement_amount DECIMAL(12,2) DEFAULT 100.00;

-- Create function to generate settlement numbers
CREATE OR REPLACE FUNCTION public.auto_generate_settlement_number()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.settlement_number IS NULL THEN
        NEW.settlement_number := generate_short_id('settlements', 'settlement_number');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add trigger for settlement number generation
CREATE TRIGGER settlements_settlement_number_trigger
    BEFORE INSERT ON public.settlements
    FOR EACH ROW
    EXECUTE FUNCTION public.auto_generate_settlement_number();

-- Add updated_at trigger for settlements
CREATE TRIGGER settlements_updated_at_trigger
    BEFORE UPDATE ON public.settlements
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Enable RLS on settlements
ALTER TABLE public.settlements ENABLE ROW LEVEL SECURITY;

-- Enable RLS on settlement_transactions  
ALTER TABLE public.settlement_transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for settlements
CREATE POLICY "Admins can manage all settlements" 
ON public.settlements FOR ALL 
USING (is_admin()) 
WITH CHECK (is_admin());

CREATE POLICY "Merchants can view their own settlements" 
ON public.settlements FOR SELECT 
USING (merchant_id = auth.uid());

-- RLS Policies for settlement_transactions
CREATE POLICY "Admins can manage all settlement transactions" 
ON public.settlement_transactions FOR ALL 
USING (is_admin()) 
WITH CHECK (is_admin());

CREATE POLICY "Merchants can view their settlement transactions" 
ON public.settlement_transactions FOR SELECT 
USING (
  settlement_id IN (
    SELECT id FROM public.settlements WHERE merchant_id = auth.uid()
  )
);

-- Create function to calculate unsettled transaction totals for a merchant
CREATE OR REPLACE FUNCTION public.get_unsettled_transactions_summary(p_merchant_id UUID)
RETURNS TABLE(
  total_transactions BIGINT,
  total_amount DECIMAL(12,2),
  oldest_transaction_date TIMESTAMP WITH TIME ZONE
) 
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(t.id)::BIGINT,
    COALESCE(SUM(t.amount), 0)::DECIMAL(12,2),
    MIN(t.created_at)
  FROM transactions t
  JOIN bookings b ON t.booking_id = b.id
  JOIN study_halls sh ON b.study_hall_id = sh.id
  WHERE sh.merchant_id = p_merchant_id
    AND t.status = 'completed'
    AND b.status = 'completed'
    AND b.payment_status = 'paid'
    AND NOT EXISTS (
      SELECT 1 FROM settlement_transactions st 
      WHERE st.transaction_id = t.id
    );
END;
$$;

-- Create function to get eligible transactions for settlement
CREATE OR REPLACE FUNCTION public.get_eligible_transactions_for_settlement(p_merchant_id UUID)
RETURNS TABLE(
  transaction_id UUID,
  booking_id UUID,
  amount DECIMAL(12,2),
  transaction_created_at TIMESTAMP WITH TIME ZONE,
  booking_start_date DATE,
  booking_end_date DATE,
  user_email TEXT,
  study_hall_name TEXT
) 
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    t.id,
    t.booking_id,
    t.amount,
    t.created_at,
    b.start_date,
    b.end_date,
    p.email,
    sh.name
  FROM transactions t
  JOIN bookings b ON t.booking_id = b.id
  JOIN study_halls sh ON b.study_hall_id = sh.id
  JOIN profiles p ON b.user_id = p.id
  WHERE sh.merchant_id = p_merchant_id
    AND t.status = 'completed'
    AND b.status = 'completed'
    AND b.payment_status = 'paid'
    AND NOT EXISTS (
      SELECT 1 FROM settlement_transactions st 
      WHERE st.transaction_id = t.id
    )
  ORDER BY t.created_at DESC;
END;
$$;