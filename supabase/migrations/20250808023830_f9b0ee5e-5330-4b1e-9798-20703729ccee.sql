-- Update eligible transactions RPC to include booking_type
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
  booking_number integer,
  booking_type text
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
      b.booking_number,
      'study_hall'::text AS booking_type
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
      cb.booking_number,
      'cabin'::text AS booking_type
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