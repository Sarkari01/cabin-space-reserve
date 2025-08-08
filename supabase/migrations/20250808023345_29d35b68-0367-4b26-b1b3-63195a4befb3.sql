-- 1) Add cabin_booking_id to settlement_transactions and relax booking_id nullability
DO $$
BEGIN
  -- Make booking_id nullable (no-op if already nullable)
  BEGIN
    ALTER TABLE public.settlement_transactions ALTER COLUMN booking_id DROP NOT NULL;
  EXCEPTION WHEN undefined_column THEN
    -- Column does not exist on this environment; ignore
    NULL;
  END;

  -- Add cabin_booking_id if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'settlement_transactions' 
      AND column_name = 'cabin_booking_id'
  ) THEN
    ALTER TABLE public.settlement_transactions 
      ADD COLUMN cabin_booking_id uuid NULL;

    ALTER TABLE public.settlement_transactions 
      ADD CONSTRAINT settlement_transactions_cabin_booking_id_fkey
      FOREIGN KEY (cabin_booking_id) REFERENCES public.cabin_bookings(id) ON DELETE SET NULL;

    CREATE INDEX IF NOT EXISTS idx_settlement_transactions_cabin_booking_id 
      ON public.settlement_transactions(cabin_booking_id);
  END IF;
END $$;

-- 2) Update summary RPC to include both study hall and private hall (cabin) transactions
CREATE OR REPLACE FUNCTION public.get_unsettled_transactions_summary(p_merchant_id uuid)
RETURNS TABLE(
  total_transactions bigint,
  total_amount numeric,
  oldest_transaction_date timestamptz
) LANGUAGE plpgsql STABLE AS $$
BEGIN
  RETURN QUERY
  WITH unioned AS (
    -- Study hall transactions
    SELECT 
      COUNT(t.id)::bigint AS cnt,
      COALESCE(SUM(COALESCE(t.booking_amount, t.amount)), 0)::numeric AS amt,
      MIN(t.created_at) AS oldest
    FROM public.transactions t
    JOIN public.bookings b ON t.booking_id = b.id
    JOIN public.study_halls sh ON b.study_hall_id = sh.id
    WHERE sh.merchant_id = p_merchant_id
      AND t.status = 'completed'
      AND b.status = 'completed'
      AND b.payment_status = 'paid'
      AND NOT EXISTS (
        SELECT 1 FROM public.settlement_transactions st 
        WHERE st.transaction_id = t.id
      )
    UNION ALL
    -- Private hall (cabin) transactions
    SELECT 
      COUNT(t.id)::bigint AS cnt,
      COALESCE(SUM(COALESCE(t.booking_amount, t.amount)), 0)::numeric AS amt,
      MIN(t.created_at) AS oldest
    FROM public.transactions t
    JOIN public.cabin_bookings cb ON t.cabin_booking_id = cb.id
    JOIN public.private_halls ph ON cb.private_hall_id = ph.id
    WHERE ph.merchant_id = p_merchant_id
      AND t.status = 'completed'
      AND cb.status = 'completed'
      AND cb.payment_status = 'paid'
      AND NOT EXISTS (
        SELECT 1 FROM public.settlement_transactions st 
        WHERE st.transaction_id = t.id
      )
  )
  SELECT COALESCE(SUM(cnt), 0)::bigint,
         COALESCE(SUM(amt), 0)::numeric,
         MIN(oldest)
  FROM unioned;
END;
$$;

-- 3) Update eligible transactions RPC to return both types
CREATE OR REPLACE FUNCTION public.get_eligible_transactions_for_settlement(p_merchant_id uuid)
RETURNS TABLE(
  transaction_id uuid,
  booking_id uuid,
  amount numeric,
  transaction_created_at timestamptz,
  booking_start_date date,
  booking_end_date date,
  user_email text,
  study_hall_name text,
  transaction_number integer,
  booking_number integer
) LANGUAGE plpgsql STABLE AS $$
BEGIN
  RETURN QUERY
  (
    -- Study hall transactions
    SELECT 
      t.id AS transaction_id,
      b.id AS booking_id,
      COALESCE(t.booking_amount, t.amount) AS amount,
      t.created_at AS transaction_created_at,
      b.start_date AS booking_start_date,
      b.end_date AS booking_end_date,
      p.email AS user_email,
      sh.name AS study_hall_name,
      t.transaction_number,
      b.booking_number
    FROM public.transactions t
    JOIN public.bookings b ON t.booking_id = b.id
    JOIN public.study_halls sh ON b.study_hall_id = sh.id
    JOIN public.profiles p ON b.user_id = p.id
    WHERE sh.merchant_id = p_merchant_id
      AND t.status = 'completed'
      AND b.status = 'completed'
      AND b.payment_status = 'paid'
      AND NOT EXISTS (
        SELECT 1 FROM public.settlement_transactions st 
        WHERE st.transaction_id = t.id
      )
  )
  UNION ALL
  (
    -- Private hall (cabin) transactions
    SELECT 
      t.id AS transaction_id,
      cb.id AS booking_id,
      COALESCE(t.booking_amount, t.amount) AS amount,
      t.created_at AS transaction_created_at,
      cb.start_date AS booking_start_date,
      cb.end_date AS booking_end_date,
      COALESCE(p.email, cb.guest_email) AS user_email,
      ph.name AS study_hall_name,
      t.transaction_number,
      cb.booking_number
    FROM public.transactions t
    JOIN public.cabin_bookings cb ON t.cabin_booking_id = cb.id
    JOIN public.private_halls ph ON cb.private_hall_id = ph.id
    LEFT JOIN public.profiles p ON cb.user_id = p.id
    WHERE ph.merchant_id = p_merchant_id
      AND t.status = 'completed'
      AND cb.status = 'completed'
      AND cb.payment_status = 'paid'
      AND NOT EXISTS (
        SELECT 1 FROM public.settlement_transactions st 
        WHERE st.transaction_id = t.id
      )
  )
  ORDER BY transaction_created_at DESC;
END;
$$;