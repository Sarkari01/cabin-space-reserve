-- Fix existing seat availability for confirmed bookings
UPDATE seats 
SET is_available = false 
WHERE id IN (
  SELECT DISTINCT b.seat_id 
  FROM bookings b 
  WHERE b.status IN ('confirmed', 'pending') 
  AND b.seat_id IS NOT NULL
);

-- Add index for better performance on seat availability queries
CREATE INDEX IF NOT EXISTS idx_seats_availability ON seats(is_available);
CREATE INDEX IF NOT EXISTS idx_bookings_seat_status ON bookings(seat_id, status);