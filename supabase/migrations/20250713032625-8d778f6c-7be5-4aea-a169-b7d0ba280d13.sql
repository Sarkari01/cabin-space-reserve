-- Clean up all existing test bookings
DELETE FROM bookings;

-- Clean up all existing transactions
DELETE FROM transactions;

-- Reset seat availability for all seats
UPDATE seats SET is_available = true;