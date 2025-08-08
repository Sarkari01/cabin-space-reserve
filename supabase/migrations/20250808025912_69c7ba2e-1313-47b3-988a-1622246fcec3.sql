
-- 1) Settlement Requests table to allow merchants to request admin-approved settlements
CREATE TABLE IF NOT EXISTS public.settlement_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id UUID NOT NULL,
  requested_by UUID NOT NULL,
  admin_id UUID,
  transaction_ids UUID[] NOT NULL,
  total_booking_amount NUMERIC NOT NULL DEFAULT 0,
  total_deposit_amount NUMERIC NOT NULL DEFAULT 0,
  total_amount NUMERIC NOT NULL DEFAULT 0,
  platform_fee_percentage NUMERIC NOT NULL DEFAULT 10.00,
  platform_fee_amount NUMERIC NOT NULL DEFAULT 0,
  net_settlement_amount NUMERIC NOT NULL DEFAULT 0,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'pending', -- pending | approved | rejected | cancelled
  linked_settlement_id UUID NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  processed_at TIMESTAMPTZ NULL
);

-- Helpful index for queries
CREATE INDEX IF NOT EXISTS settlement_requests_merchant_idx ON public.settlement_requests (merchant_id, status);

-- Keep updated_at fresh
CREATE OR REPLACE FUNCTION public.update_settlement_requests_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_update_settlement_requests_updated_at ON public.settlement_requests;
CREATE TRIGGER trg_update_settlement_requests_updated_at
BEFORE UPDATE ON public.settlement_requests
FOR EACH ROW
EXECUTE FUNCTION public.update_settlement_requests_updated_at();

-- RLS
ALTER TABLE public.settlement_requests ENABLE ROW LEVEL SECURITY;

-- Admins can manage all requests
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'settlement_requests' AND policyname = 'Admins can manage all settlement requests'
  ) THEN
    CREATE POLICY "Admins can manage all settlement requests"
      ON public.settlement_requests
      AS PERMISSIVE
      FOR ALL
      USING (is_admin())
      WITH CHECK (is_admin());
  END IF;
END$$;

-- Merchants can view their own requests
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'settlement_requests' AND policyname = 'Merchants can view their own settlement requests'
  ) THEN
    CREATE POLICY "Merchants can view their own settlement requests"
      ON public.settlement_requests
      AS PERMISSIVE
      FOR SELECT
      USING (merchant_id = auth.uid());
  END IF;
END$$;

-- 2) RPC: Merchant requests a settlement for selected transactions
CREATE OR REPLACE FUNCTION public.request_settlement(
  p_transaction_ids UUID[],
  p_platform_fee_percentage NUMERIC DEFAULT NULL,
  p_notes TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_merchant_id UUID;
  v_platform_fee NUMERIC := 10.00;
  v_booking_total NUMERIC := 0;
  v_deposit_total NUMERIC := 0;
  v_total NUMERIC := 0;
  v_fee_amount NUMERIC := 0;
  v_net_amount NUMERIC := 0;
  v_req_id UUID;
  v_cnt INT := 0;
BEGIN
  v_merchant_id := auth.uid();
  IF v_merchant_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
  END IF;

  IF p_transaction_ids IS NULL OR array_length(p_transaction_ids, 1) IS NULL OR array_length(p_transaction_ids, 1) = 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'No transactions selected');
  END IF;

  -- Load default platform fee
  SELECT COALESCE(platform_fee_percentage, 10.00)
  INTO v_platform_fee
  FROM business_settings
  LIMIT 1;

  v_platform_fee := COALESCE(p_platform_fee_percentage, v_platform_fee);

  -- Validate all transactions belong to this merchant and are eligible (completed, not settled)
  WITH tx AS (
    SELECT
      t.id,
      t.amount,
      COALESCE(t.booking_amount, t.amount) AS booking_amount,
      COALESCE(t.deposit_amount, 0) AS deposit_amount
    FROM transactions t
    WHERE t.id = ANY(p_transaction_ids)
      AND t.status = 'completed'
      AND NOT EXISTS (
        SELECT 1 FROM settlement_transactions st WHERE st.transaction_id = t.id
      )
      AND (
        -- Study hall transaction belongs to merchant
        EXISTS (
          SELECT 1
          FROM bookings b
          JOIN study_halls sh ON sh.id = b.study_hall_id
          WHERE b.id = t.booking_id
            AND sh.merchant_id = v_merchant_id
        )
        OR
        -- Cabin/private hall transaction belongs to merchant
        EXISTS (
          SELECT 1
          FROM cabin_bookings cb
          JOIN private_halls ph ON ph.id = cb.private_hall_id
          WHERE cb.id = t.cabin_booking_id
            AND ph.merchant_id = v_merchant_id
        )
      )
  ),
  totals AS (
    SELECT
      COUNT(*) AS cnt,
      COALESCE(SUM(booking_amount), 0) AS booking_total,
      COALESCE(SUM(deposit_amount), 0) AS deposit_total,
      COALESCE(SUM(amount), 0) AS grand_total
    FROM tx
  )
  SELECT cnt, booking_total, deposit_total, grand_total
  INTO v_cnt, v_booking_total, v_deposit_total, v_total
  FROM totals;

  -- Ensure all requested transactions passed validation
  IF v_cnt IS DISTINCT FROM array_length(p_transaction_ids, 1) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Some transactions are not eligible or do not belong to this merchant');
  END IF;

  -- Fee on booking amount only; deposits excluded by default
  v_fee_amount := ROUND(v_booking_total * v_platform_fee / 100.0, 2);
  v_net_amount := v_total - v_fee_amount;

  INSERT INTO public.settlement_requests (
    merchant_id,
    requested_by,
    transaction_ids,
    total_booking_amount,
    total_deposit_amount,
    total_amount,
    platform_fee_percentage,
    platform_fee_amount,
    net_settlement_amount,
    notes,
    status
  ) VALUES (
    v_merchant_id,
    v_merchant_id,
    p_transaction_ids,
    v_booking_total,
    v_deposit_total,
    v_total,
    v_platform_fee,
    v_fee_amount,
    v_net_amount,
    p_notes,
    'pending'
  )
  RETURNING id INTO v_req_id;

  RETURN jsonb_build_object(
    'success', true,
    'request_id', v_req_id,
    'booking_total', v_booking_total,
    'deposit_total', v_deposit_total,
    'total', v_total,
    'fee_percentage', v_platform_fee,
    'fee_amount', v_fee_amount,
    'net_amount', v_net_amount
  );
END;
$$;

-- 3) RPC: Admin approves a request and auto-creates a settlement
CREATE OR REPLACE FUNCTION public.approve_settlement_request(
  p_request_id UUID,
  p_payment_method TEXT DEFAULT NULL,
  p_payment_reference TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_admin_id UUID;
  v_req RECORD;
  v_settlement_id UUID;
BEGIN
  v_admin_id := auth.uid();
  IF v_admin_id IS NULL OR NOT is_admin() THEN
    RETURN jsonb_build_object('success', false, 'error', 'Admin privileges required');
  END IF;

  SELECT * INTO v_req
  FROM public.settlement_requests
  WHERE id = p_request_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Request not found');
  END IF;

  IF v_req.status <> 'pending' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Request is not pending');
  END IF;

  -- Create the settlement (platform fee on booking amount; net = total - fee)
  INSERT INTO public.settlements (
    admin_id,
    merchant_id,
    total_booking_amount,
    platform_fee_percentage,
    platform_fee_amount,
    net_settlement_amount,
    payment_date,
    status,
    payment_reference,
    payment_method,
    notes
  ) VALUES (
    v_admin_id,
    v_req.merchant_id,
    v_req.total_booking_amount,
    v_req.platform_fee_percentage,
    v_req.platform_fee_amount,
    (v_req.total_amount - v_req.platform_fee_amount),
    now(),
    'approved',
    p_payment_reference,
    p_payment_method,
    v_req.notes
  )
  RETURNING id INTO v_settlement_id;

  -- Link transactions
  INSERT INTO public.settlement_transactions (settlement_id, transaction_id, created_at)
  SELECT v_settlement_id, unnest(v_req.transaction_ids), now();

  -- Mark the request as approved
  UPDATE public.settlement_requests
  SET status = 'approved',
      admin_id = v_admin_id,
      processed_at = now(),
      linked_settlement_id = v_settlement_id
  WHERE id = p_request_id;

  RETURN jsonb_build_object('success', true, 'settlement_id', v_settlement_id);
END;
$$;

-- 4) RPC: Admin rejects a request
CREATE OR REPLACE FUNCTION public.reject_settlement_request(
  p_request_id UUID,
  p_admin_notes TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_admin_id UUID;
  v_req RECORD;
BEGIN
  v_admin_id := auth.uid();
  IF v_admin_id IS NULL OR NOT is_admin() THEN
    RETURN jsonb_build_object('success', false, 'error', 'Admin privileges required');
  END IF;

  SELECT * INTO v_req
  FROM public.settlement_requests
  WHERE id = p_request_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Request not found');
  END IF;

  IF v_req.status <> 'pending' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Request is not pending');
  END IF;

  UPDATE public.settlement_requests
  SET status = 'rejected',
      admin_id = v_admin_id,
      processed_at = now(),
      notes = COALESCE(notes, '') || CASE WHEN p_admin_notes IS NOT NULL THEN '\nAdmin: ' || p_admin_notes ELSE '' END
  WHERE id = p_request_id;

  RETURN jsonb_build_object('success', true);
END;
$$;
