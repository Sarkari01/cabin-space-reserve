-- Update the get_eligible_transactions_for_settlement function to include numeric IDs
CREATE OR REPLACE FUNCTION public.get_eligible_transactions_for_settlement(p_merchant_id uuid)
 RETURNS TABLE(
   transaction_id uuid, 
   booking_id uuid, 
   amount numeric, 
   transaction_created_at timestamp with time zone, 
   booking_start_date date, 
   booking_end_date date, 
   user_email text, 
   study_hall_name text,
   transaction_number integer,
   booking_number integer
 )
 LANGUAGE plpgsql
 STABLE
AS $function$
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
    sh.name,
    t.transaction_number,
    b.booking_number
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
$function$