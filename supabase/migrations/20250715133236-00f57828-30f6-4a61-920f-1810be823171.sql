-- Fix the settlement with settlement_number = 0
UPDATE settlements 
SET settlement_number = generate_short_id('settlements', 'settlement_number')
WHERE settlement_number = 0;

-- Improve the get_merchant_available_balance function to handle edge cases better
CREATE OR REPLACE FUNCTION public.get_merchant_available_balance(p_merchant_id uuid)
 RETURNS TABLE(total_earnings numeric, platform_fees numeric, net_earnings numeric, pending_withdrawals numeric, available_balance numeric)
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
  
  -- If no business settings exist, use default values
  IF v_business_settings IS NULL THEN
    v_business_settings.platform_fee_percentage := 10.00;
  END IF;
  
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
    GREATEST(ROUND(e.total_amount * (100 - COALESCE(v_business_settings.platform_fee_percentage, 10)) / 100, 2) - w.pending_amount, 0)
  FROM earnings e, withdrawals w;
END;
$function$;

-- Improve the auto-generation trigger to ensure it never sets 0
CREATE OR REPLACE FUNCTION public.auto_generate_settlement_number()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    -- Always generate a new number, even if one was provided
    NEW.settlement_number := generate_short_id('settlements', 'settlement_number');
    RETURN NEW;
END;
$function$;