-- Fix pending C1 transaction and create booking
-- Transaction ID: 642576e4-c4ca-4fc9-a7f5-7b307506a365
-- Seat ID: a72f89aa-c1fd-425b-9f33-f7042c22e9ef

-- First, create the booking for the C1 seat
INSERT INTO public.bookings (
  id,
  user_id,
  study_hall_id,
  seat_id,
  booking_period,
  start_date,
  end_date,
  total_amount,
  status,
  payment_status
) VALUES (
  gen_random_uuid(),
  (SELECT user_id FROM transactions WHERE id = '642576e4-c4ca-4fc9-a7f5-7b307506a365'),
  (SELECT study_hall_id FROM seats WHERE id = 'a72f89aa-c1fd-425b-9f33-f7042c22e9ef'),
  'a72f89aa-c1fd-425b-9f33-f7042c22e9ef',
  'daily',
  CURRENT_DATE,
  CURRENT_DATE,
  1.00,
  'active',
  'paid'
);

-- Update the transaction status to completed and link it to the booking
UPDATE public.transactions 
SET 
  status = 'completed',
  booking_id = (
    SELECT id FROM bookings 
    WHERE seat_id = 'a72f89aa-c1fd-425b-9f33-f7042c22e9ef' 
    AND user_id = (SELECT user_id FROM transactions WHERE id = '642576e4-c4ca-4fc9-a7f5-7b307506a365')
    ORDER BY created_at DESC 
    LIMIT 1
  ),
  updated_at = now()
WHERE id = '642576e4-c4ca-4fc9-a7f5-7b307506a365';

-- Mark the seat as unavailable
UPDATE public.seats 
SET is_available = false 
WHERE id = 'a72f89aa-c1fd-425b-9f33-f7042c22e9ef';