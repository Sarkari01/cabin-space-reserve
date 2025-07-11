-- Create business_settings table for payment gateway configuration
CREATE TABLE public.business_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  razorpay_enabled BOOLEAN NOT NULL DEFAULT false,
  razorpay_key_id TEXT,
  ekqr_enabled BOOLEAN NOT NULL DEFAULT false,
  ekqr_merchant_id TEXT,
  offline_enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create transactions table for unified payment tracking
CREATE TABLE public.transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id UUID REFERENCES public.bookings(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id),
  amount DECIMAL(10,2) NOT NULL,
  payment_method TEXT NOT NULL, -- 'razorpay', 'ekqr', 'offline'
  payment_id TEXT, -- External payment gateway ID
  qr_id TEXT, -- For EKQR payments
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed', 'refunded'
  payment_data JSONB, -- Store gateway-specific response data
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.business_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- RLS policies for business_settings
CREATE POLICY "Admin full access to business settings"
ON public.business_settings
FOR ALL
USING (is_admin())
WITH CHECK (is_admin());

-- RLS policies for transactions
CREATE POLICY "Users can view their own transactions"
ON public.transactions
FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Merchants can view transactions for their bookings"
ON public.transactions
FOR SELECT
USING (booking_id IN (
  SELECT b.id FROM public.bookings b
  JOIN public.study_halls sh ON b.study_hall_id = sh.id
  WHERE sh.merchant_id = auth.uid()
));

CREATE POLICY "Admin can view all transactions"
ON public.transactions
FOR SELECT
USING (is_admin());

CREATE POLICY "System can create transactions"
ON public.transactions
FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admin can update transaction status"
ON public.transactions
FOR UPDATE
USING (is_admin());

-- Add updated_at triggers
CREATE TRIGGER update_business_settings_updated_at
BEFORE UPDATE ON public.business_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_transactions_updated_at
BEFORE UPDATE ON public.transactions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default business settings
INSERT INTO public.business_settings (razorpay_enabled, ekqr_enabled, offline_enabled)
VALUES (false, false, true);