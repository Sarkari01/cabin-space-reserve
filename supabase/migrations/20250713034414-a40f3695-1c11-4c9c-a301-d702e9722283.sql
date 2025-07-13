-- Update existing pending booking to confirmed status
UPDATE bookings SET status = 'confirmed' WHERE status = 'pending';