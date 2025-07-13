-- Clean up duplicate pending bookings, keeping only the confirmed ones
DELETE FROM bookings 
WHERE status = 'pending' 
AND id NOT IN (
  SELECT DISTINCT ON (user_id, study_hall_id, seat_id) id
  FROM bookings 
  WHERE status = 'confirmed'
  ORDER BY user_id, study_hall_id, seat_id, created_at DESC
);