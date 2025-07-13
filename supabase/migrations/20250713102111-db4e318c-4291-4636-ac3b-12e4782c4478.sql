-- Fix the orphaned completed transaction by creating the missing booking
-- First let's check the existing transaction data
DO $$
DECLARE
    orphaned_txn RECORD;
    booking_intent JSONB;
    new_booking_id UUID;
BEGIN
    -- Find the completed transaction without booking_id
    SELECT * INTO orphaned_txn 
    FROM transactions 
    WHERE status = 'completed' 
    AND booking_id IS NULL 
    AND payment_data IS NOT NULL
    LIMIT 1;
    
    IF FOUND THEN
        -- Extract booking intent from payment_data
        booking_intent := orphaned_txn.payment_data->'bookingIntent';
        
        IF booking_intent IS NOT NULL THEN
            RAISE NOTICE 'Found orphaned transaction: %, creating booking...', orphaned_txn.id;
            
            -- Create the missing booking
            INSERT INTO bookings (
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
                orphaned_txn.user_id,
                (booking_intent->>'study_hall_id')::UUID,
                (booking_intent->>'seat_id')::UUID,
                (booking_intent->>'booking_period')::booking_period,
                (booking_intent->>'start_date')::DATE,
                (booking_intent->>'end_date')::DATE,
                (booking_intent->>'total_amount')::NUMERIC,
                'confirmed',
                'paid'
            ) RETURNING id INTO new_booking_id;
            
            -- Link transaction to booking
            UPDATE transactions 
            SET booking_id = new_booking_id 
            WHERE id = orphaned_txn.id;
            
            -- Mark seat as unavailable
            UPDATE seats 
            SET is_available = false 
            WHERE id = (booking_intent->>'seat_id')::UUID;
            
            RAISE NOTICE 'Successfully created booking % for transaction %', new_booking_id, orphaned_txn.id;
        ELSE
            RAISE NOTICE 'Transaction % has no booking intent data', orphaned_txn.id;
        END IF;
    ELSE
        RAISE NOTICE 'No orphaned transactions found';
    END IF;
END $$;