-- Add columns to settlement_transactions table to store numeric IDs for quick access
ALTER TABLE settlement_transactions 
ADD COLUMN IF NOT EXISTS transaction_number integer,
ADD COLUMN IF NOT EXISTS booking_number integer;

-- Update existing settlement_transactions with numeric IDs
UPDATE settlement_transactions st
SET 
  transaction_number = t.transaction_number,
  booking_number = b.booking_number
FROM transactions t
JOIN bookings b ON t.booking_id = b.id
WHERE st.transaction_id = t.id
  AND st.booking_id = b.id
  AND (st.transaction_number IS NULL OR st.booking_number IS NULL);