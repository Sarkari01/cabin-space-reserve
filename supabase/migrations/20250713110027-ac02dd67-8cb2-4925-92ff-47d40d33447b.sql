-- Phase 1: Fix the current pending B3 transaction
-- This will check the specific pending transaction and create the booking if needed

DO $$
DECLARE
    transaction_record RECORD;
    seat_record RECORD;
    new_booking_id UUID;
    booking_exists BOOLEAN;
BEGIN
    -- Get the pending transaction details
    SELECT t.*, b.id as existing_booking_id
    INTO transaction_record
    FROM transactions t
    LEFT JOIN bookings b ON t.booking_id = b.id
    WHERE t.id = '5772644d-617b-427b-b5a9-dd3a0fe2c064'
    AND t.status = 'pending'
    AND t.payment_method = 'ekqr';
    
    IF transaction_record.id IS NOT NULL THEN
        RAISE LOG 'Found pending EKQR transaction: %', transaction_record.id;
        
        -- Check if booking already exists
        booking_exists := transaction_record.existing_booking_id IS NOT NULL;
        
        IF NOT booking_exists THEN
            -- Get the seat information from payment_data
            SELECT s.* INTO seat_record 
            FROM seats s 
            WHERE s.seat_id = 'B3' 
            AND s.study_hall_id = (transaction_record.payment_data->>'study_hall_id')::uuid;
            
            IF seat_record.id IS NOT NULL THEN
                -- Create the booking
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
                    payment_status
                ) VALUES (
                    gen_random_uuid(),
                    transaction_record.user_id,
                    seat_record.study_hall_id,
                    seat_record.id,
                    (transaction_record.payment_data->>'booking_period')::booking_period,
                    (transaction_record.payment_data->>'start_date')::date,
                    (transaction_record.payment_data->>'end_date')::date,
                    transaction_record.amount,
                    'confirmed',
                    'paid'
                ) RETURNING id INTO new_booking_id;
                
                -- Update the transaction with the booking_id and mark as completed
                UPDATE transactions 
                SET booking_id = new_booking_id,
                    status = 'completed',
                    updated_at = now()
                WHERE id = transaction_record.id;
                
                -- Mark the seat as unavailable
                UPDATE seats 
                SET is_available = false 
                WHERE id = seat_record.id;
                
                RAISE LOG 'Successfully created booking % for transaction % and marked seat B3 as unavailable', new_booking_id, transaction_record.id;
            ELSE
                RAISE LOG 'Seat B3 not found for study hall %', (transaction_record.payment_data->>'study_hall_id');
            END IF;
        ELSE
            RAISE LOG 'Booking already exists for transaction %', transaction_record.id;
        END IF;
    ELSE
        RAISE LOG 'No pending EKQR transaction found with ID 5772644d-617b-427b-b5a9-dd3a0fe2c064';
    END IF;
END $$;