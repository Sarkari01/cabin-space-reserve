-- Create withdrawal_requests table
CREATE TABLE public.withdrawal_requests (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  merchant_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  requested_amount numeric(12,2) NOT NULL CHECK (requested_amount > 0),
  withdrawal_method text NOT NULL DEFAULT 'bank_transfer',
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'processing', 'completed', 'rejected')),
  admin_notes text,
  payment_reference text,
  payment_method text,
  processed_by uuid REFERENCES public.profiles(id),
  processed_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on withdrawal_requests
ALTER TABLE public.withdrawal_requests ENABLE ROW LEVEL SECURITY;

-- Create policies for withdrawal_requests
CREATE POLICY "Merchants can create their own withdrawal requests"
ON public.withdrawal_requests
FOR INSERT
WITH CHECK (merchant_id = auth.uid());

CREATE POLICY "Merchants can view their own withdrawal requests"
ON public.withdrawal_requests
FOR SELECT
USING (merchant_id = auth.uid());

CREATE POLICY "Merchants can update their pending withdrawal requests"
ON public.withdrawal_requests
FOR UPDATE
USING (merchant_id = auth.uid() AND status = 'pending');

CREATE POLICY "Admins can manage all withdrawal requests"
ON public.withdrawal_requests
FOR ALL
USING (is_admin())
WITH CHECK (is_admin());

-- Auto-generate withdrawal request number
CREATE OR REPLACE FUNCTION public.auto_generate_withdrawal_number()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
BEGIN
    -- We'll use the id field as the unique identifier, no separate number needed
    RETURN NEW;
END;
$function$;

-- Add trigger for updated_at
CREATE TRIGGER update_withdrawal_requests_updated_at
BEFORE UPDATE ON public.withdrawal_requests
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to get merchant available balance
CREATE OR REPLACE FUNCTION public.get_merchant_available_balance(p_merchant_id uuid)
RETURNS TABLE(
  total_earnings numeric,
  platform_fees numeric,
  net_earnings numeric,
  pending_withdrawals numeric,
  available_balance numeric
)
LANGUAGE plpgsql
STABLE
AS $function$
DECLARE
  v_business_settings RECORD;
BEGIN
  -- Get business settings for platform fee percentage
  SELECT platform_fee_percentage INTO v_business_settings
  FROM business_settings
  LIMIT 1;
  
  RETURN QUERY
  WITH earnings AS (
    SELECT 
      COALESCE(SUM(t.amount), 0) as total_amount
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
      )
  ),
  withdrawals AS (
    SELECT 
      COALESCE(SUM(wr.requested_amount), 0) as pending_amount
    FROM withdrawal_requests wr
    WHERE wr.merchant_id = p_merchant_id
      AND wr.status IN ('pending', 'approved', 'processing')
  )
  SELECT 
    e.total_amount,
    ROUND(e.total_amount * COALESCE(v_business_settings.platform_fee_percentage, 10) / 100, 2),
    ROUND(e.total_amount * (100 - COALESCE(v_business_settings.platform_fee_percentage, 10)) / 100, 2),
    w.pending_amount,
    ROUND(e.total_amount * (100 - COALESCE(v_business_settings.platform_fee_percentage, 10)) / 100, 2) - w.pending_amount
  FROM earnings e, withdrawals w;
END;
$function$;

-- Create function to validate withdrawal request
CREATE OR REPLACE FUNCTION public.validate_withdrawal_request(p_merchant_id uuid, p_amount numeric)
RETURNS TABLE(
  is_valid boolean,
  error_message text,
  available_balance numeric
)
LANGUAGE plpgsql
STABLE
AS $function$
DECLARE
  v_balance RECORD;
  v_min_amount numeric;
BEGIN
  -- Get minimum withdrawal amount from business settings
  SELECT minimum_settlement_amount INTO v_min_amount
  FROM business_settings
  LIMIT 1;
  
  -- Get merchant's available balance
  SELECT * INTO v_balance
  FROM get_merchant_available_balance(p_merchant_id);
  
  -- Validate amount
  IF p_amount <= 0 THEN
    RETURN QUERY SELECT false, 'Withdrawal amount must be greater than 0', v_balance.available_balance;
    RETURN;
  END IF;
  
  IF p_amount < COALESCE(v_min_amount, 100) THEN
    RETURN QUERY SELECT false, 'Withdrawal amount is below minimum limit of ₹' || COALESCE(v_min_amount, 100), v_balance.available_balance;
    RETURN;
  END IF;
  
  IF p_amount > v_balance.available_balance THEN
    RETURN QUERY SELECT false, 'Insufficient available balance. Available: ₹' || v_balance.available_balance, v_balance.available_balance;
    RETURN;
  END IF;
  
  -- All validations passed
  RETURN QUERY SELECT true, 'Valid withdrawal request', v_balance.available_balance;
END;
$function$;

-- Update business_settings table to include withdrawal limits
ALTER TABLE public.business_settings 
ADD COLUMN IF NOT EXISTS minimum_withdrawal_amount numeric(12,2) DEFAULT 500.00,
ADD COLUMN IF NOT EXISTS auto_approval_threshold numeric(12,2) DEFAULT 10000.00,
ADD COLUMN IF NOT EXISTS withdrawal_processing_days integer DEFAULT 3;