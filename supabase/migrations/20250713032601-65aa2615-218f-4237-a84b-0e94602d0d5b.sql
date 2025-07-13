-- Clean up existing test bookings to reset ID sequence
DELETE FROM bookings WHERE id IN ('1', '2', '3', '4', '5');

-- Reset seat availability for all seats
UPDATE seats SET is_available = true;