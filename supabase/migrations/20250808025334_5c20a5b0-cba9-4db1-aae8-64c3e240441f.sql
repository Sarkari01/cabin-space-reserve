
-- 1) Include Private Hall (cabin) transactions in merchant balance
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
  v_platform_fee numeric := 10.00;
  v_total numeric := 0;
  v_pending_withdrawals numeric := 0;
BEGIN
  -- Load platform fee from business settings (fallback to 10%)
  SELECT COALESCE(platform_fee_percentage, 10.00)
  INTO v_platform_fee
  FROM business_settings
  LIMIT 1;

  WITH study AS (
    SELECT COALESCE(SUM(t.amount), 0) AS amount
    FROM transactions t
    JOIN bookings b ON b.id = t.booking_id
    JOIN study_halls sh ON sh.id = b.study_hall_id
    WHERE sh.merchant_id = p_merchant_id
      AND t.status = 'completed'
      AND b.status = 'completed'
      AND b.payment_status = 'paid'
      AND NOT EXISTS (
        SELECT 1 FROM settlement_transactions st 
        WHERE st.transaction_id = t.id
      )
  ),
  cabin AS (
    SELECT COALESCE(SUM(t.amount), 0) AS amount
    FROM transactions t
    JOIN cabin_bookings cb ON cb.id = t.cabin_booking_id
    JOIN private_halls ph ON ph.id = cb.private_hall_id
    WHERE ph.merchant_id = p_merchant_id
      AND t.status = 'completed'
      AND cb.payment_status = 'paid'
      AND cb.status IN ('active','completed')
      AND NOT EXISTS (
        SELECT 1 FROM settlement_transactions st 
        WHERE st.transaction_id = t.id
      )
  ),
  withdrawals AS (
    SELECT COALESCE(SUM(wr.requested_amount), 0) AS pending_amount
    FROM withdrawal_requests wr
    WHERE wr.merchant_id = p_merchant_id
      AND wr.status IN ('pending', 'approved', 'processing')
  )
  SELECT s.amount + c.amount, w.pending_amount
  INTO v_total, v_pending_withdrawals
  FROM study s, cabin c, withdrawals w;

  RETURN QUERY
  SELECT
    v_total AS total_earnings,
    ROUND(v_total * v_platform_fee / 100, 2) AS platform_fees,
    ROUND(v_total * (100 - v_platform_fee) / 100, 2) AS net_earnings,
    v_pending_withdrawals AS pending_withdrawals,
    GREATEST(
      ROUND(v_total * (100 - v_platform_fee) / 100, 2) - v_pending_withdrawals,
      0
    ) AS available_balance;
END;
$function$;

-- 2) Fix minimum threshold to use minimum_withdrawal_amount
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
  v_min_amount numeric := 500.00;
BEGIN
  -- Use the dedicated minimum_withdrawal_amount (fallback to 500)
  SELECT COALESCE(minimum_withdrawal_amount, 500.00)
  INTO v_min_amount
  FROM business_settings
  LIMIT 1;

  -- Get current available balance
  SELECT * INTO v_balance
  FROM get_merchant_available_balance(p_merchant_id);

  -- Validations
  IF p_amount <= 0 THEN
    RETURN QUERY SELECT false, 'Withdrawal amount must be greater than 0', v_balance.available_balance;
    RETURN;
  END IF;

  IF p_amount < v_min_amount THEN
    RETURN QUERY SELECT false, 'Withdrawal amount is below minimum limit of ₹' || v_min_amount, v_balance.available_balance;
    RETURN;
  END IF;

  IF p_amount > v_balance.available_balance THEN
    RETURN QUERY SELECT false, 'Insufficient available balance. Available: ₹' || v_balance.available_balance, v_balance.available_balance;
    RETURN;
  END IF;

  RETURN QUERY SELECT true, 'Valid withdrawal request', v_balance.available_balance;
END;
$function$;
