-- Create booking health metrics function
CREATE OR REPLACE FUNCTION public.get_booking_health_metrics()
RETURNS TABLE (
  total_bookings bigint,
  pending_unpaid bigint,
  expired_active bigint,
  orphaned_seats bigint,
  confirmed_future bigint,
  completed_today bigint
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    -- Total bookings
    (SELECT COUNT(*) FROM bookings)::bigint,
    
    -- Pending unpaid bookings over 24 hours
    (SELECT COUNT(*) FROM bookings 
     WHERE status = 'pending' 
       AND payment_status = 'unpaid' 
       AND created_at < NOW() - INTERVAL '24 hours')::bigint,
    
    -- Active/confirmed bookings past end date
    (SELECT COUNT(*) FROM bookings 
     WHERE status IN ('active', 'confirmed') 
       AND payment_status = 'paid' 
       AND end_date < CURRENT_DATE)::bigint,
    
    -- Seats marked unavailable without active bookings
    (SELECT COUNT(*) FROM seats s
     WHERE s.is_available = false 
       AND NOT EXISTS (
         SELECT 1 FROM bookings b 
         WHERE b.seat_id = s.id 
           AND b.status IN ('active', 'confirmed') 
           AND b.payment_status = 'paid'
           AND CURRENT_DATE BETWEEN b.start_date AND b.end_date
       ))::bigint,
    
    -- Confirmed future bookings
    (SELECT COUNT(*) FROM bookings 
     WHERE status = 'confirmed' 
       AND payment_status = 'paid' 
       AND start_date > CURRENT_DATE)::bigint,
    
    -- Bookings completed today
    (SELECT COUNT(*) FROM bookings 
     WHERE status = 'completed' 
       AND updated_at::date = CURRENT_DATE)::bigint;
END;
$$;