-- Phase 1: Emergency Data Recovery - Create missing bookings for completed transactions

-- Create booking for the EKQR transaction that has bookingIntent data
INSERT INTO bookings (
    id,
    user_id,
    study_hall_id,
    seat_id,
    booking_period,
    start_date,
    end_date,
    total_amount,
    status,
    payment_status,
    created_at,
    updated_at
)
SELECT 
    gen_random_uuid() as id,
    t.user_id,
    (t.payment_data->>'bookingIntent'->>'study_hall_id')::uuid as study_hall_id,
    (t.payment_data->>'bookingIntent'->>'seat_id')::uuid as seat_id,
    (t.payment_data->>'bookingIntent'->>'booking_period')::booking_period as booking_period,
    (t.payment_data->>'bookingIntent'->>'start_date')::date as start_date,
    (t.payment_data->>'bookingIntent'->>'end_date')::date as end_date,
    (t.payment_data->>'bookingIntent'->>'total_amount')::numeric as total_amount,
    'confirmed' as status,
    'paid' as payment_status,
    t.created_at,
    now() as updated_at
FROM transactions t
WHERE t.id = '9bac60a2-798b-4406-80e7-5ee289c73af4'
AND t.status = 'completed'
AND t.booking_id IS NULL
AND t.payment_data->>'bookingIntent' IS NOT NULL;

-- Link the transaction to the newly created booking
UPDATE transactions 
SET booking_id = (
    SELECT b.id 
    FROM bookings b 
    WHERE b.user_id = transactions.user_id 
    AND b.study_hall_id = (transactions.payment_data->>'bookingIntent'->>'study_hall_id')::uuid
    AND b.seat_id = (transactions.payment_data->>'bookingIntent'->>'seat_id')::uuid
    AND b.start_date = (transactions.payment_data->>'bookingIntent'->>'start_date')::date
    AND b.created_at >= transactions.created_at
    ORDER BY b.created_at DESC
    LIMIT 1
),
updated_at = now()
WHERE id = '9bac60a2-798b-4406-80e7-5ee289c73af4'
AND status = 'completed'
AND booking_id IS NULL;

-- Mark the seat as unavailable
UPDATE seats 
SET is_available = false
WHERE id = (
    SELECT b.seat_id 
    FROM bookings b 
    INNER JOIN transactions t ON t.booking_id = b.id
    WHERE t.id = '9bac60a2-798b-4406-80e7-5ee289c73af4'
);

-- Log the recovery results
DO $$
DECLARE
    created_bookings INTEGER;
    linked_transactions INTEGER;
    updated_seats INTEGER;
BEGIN
    -- Count created bookings
    SELECT COUNT(*) INTO created_bookings
    FROM bookings b
    WHERE b.created_at >= now() - interval '1 minute'
    AND EXISTS (
        SELECT 1 FROM transactions t 
        WHERE t.booking_id = b.id 
        AND t.id = '9bac60a2-798b-4406-80e7-5ee289c73af4'
    );
    
    -- Count linked transactions  
    SELECT COUNT(*) INTO linked_transactions
    FROM transactions t
    WHERE t.id = '9bac60a2-798b-4406-80e7-5ee289c73af4'
    AND t.booking_id IS NOT NULL;
    
    -- Count updated seats
    SELECT COUNT(*) INTO updated_seats
    FROM seats s
    WHERE s.is_available = false
    AND EXISTS (
        SELECT 1 FROM bookings b 
        INNER JOIN transactions t ON t.booking_id = b.id
        WHERE b.seat_id = s.id 
        AND t.id = '9bac60a2-798b-4406-80e7-5ee289c73af4'
    );
    
    RAISE NOTICE 'Data Recovery Complete: Created % booking(s), linked % transaction(s), updated % seat(s)', 
        created_bookings, linked_transactions, updated_seats;
END $$;