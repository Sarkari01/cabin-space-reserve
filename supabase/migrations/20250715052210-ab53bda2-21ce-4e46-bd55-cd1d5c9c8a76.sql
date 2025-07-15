-- Booking Lifecycle Management System

-- Function to auto-complete expired bookings and release seats
CREATE OR REPLACE FUNCTION public.auto_complete_expired_bookings()
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  booking_record RECORD;
  expired_count INTEGER := 0;
BEGIN
  RAISE LOG 'Starting auto-completion of expired bookings';
  
  -- Find bookings that should be completed (end_date has passed and status is still active/confirmed)
  FOR booking_record IN 
    SELECT b.id, b.seat_id, b.user_id, b.end_date, b.status
    FROM bookings b
    WHERE b.status IN ('active', 'confirmed') 
      AND b.payment_status = 'paid'
      AND b.end_date < CURRENT_DATE
  LOOP
    -- Mark booking as completed
    UPDATE bookings 
    SET status = 'completed', 
        updated_at = NOW()
    WHERE id = booking_record.id;
    
    -- Release the seat
    UPDATE seats 
    SET is_available = true 
    WHERE id = booking_record.seat_id;
    
    -- Create notification for user
    INSERT INTO notifications (user_id, title, message, type, action_url)
    VALUES (
      booking_record.user_id,
      'Booking Completed',
      'Your booking has been automatically completed as the booking period has ended.',
      'info',
      '/student/dashboard'
    );
    
    expired_count := expired_count + 1;
    
    RAISE LOG 'Completed booking % and released seat %', booking_record.id, booking_record.seat_id;
  END LOOP;
  
  RAISE LOG 'Auto-completed % expired bookings', expired_count;
END;
$$;

-- Function to auto-cancel unpaid bookings after 24 hours
CREATE OR REPLACE FUNCTION public.auto_cancel_unpaid_bookings()
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  booking_record RECORD;
  cancelled_count INTEGER := 0;
BEGIN
  RAISE LOG 'Starting auto-cancellation of unpaid bookings';
  
  -- Find bookings that are unpaid for more than 24 hours
  FOR booking_record IN 
    SELECT b.id, b.seat_id, b.user_id, b.created_at, b.status
    FROM bookings b
    WHERE b.status = 'pending' 
      AND b.payment_status = 'unpaid'
      AND b.created_at < NOW() - INTERVAL '24 hours'
  LOOP
    -- Cancel the booking
    UPDATE bookings 
    SET status = 'cancelled', 
        updated_at = NOW()
    WHERE id = booking_record.id;
    
    -- Release the seat
    UPDATE seats 
    SET is_available = true 
    WHERE id = booking_record.seat_id;
    
    -- Create notification for user
    INSERT INTO notifications (user_id, title, message, type, action_url)
    VALUES (
      booking_record.user_id,
      'Booking Cancelled',
      'Your unpaid booking has been automatically cancelled after 24 hours. The seat is now available for others.',
      'warning',
      '/student/dashboard'
    );
    
    cancelled_count := cancelled_count + 1;
    
    RAISE LOG 'Cancelled unpaid booking % and released seat %', booking_record.id, booking_record.seat_id;
  END LOOP;
  
  RAISE LOG 'Auto-cancelled % unpaid bookings', cancelled_count;
END;
$$;

-- Function to progress booking statuses based on dates
CREATE OR REPLACE FUNCTION public.progress_booking_statuses()
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  booking_record RECORD;
  activated_count INTEGER := 0;
BEGIN
  RAISE LOG 'Starting booking status progression';
  
  -- Activate confirmed bookings that have reached their start date
  FOR booking_record IN 
    SELECT b.id, b.user_id, b.start_date, b.status
    FROM bookings b
    WHERE b.status = 'confirmed' 
      AND b.payment_status = 'paid'
      AND b.start_date <= CURRENT_DATE
  LOOP
    -- Activate the booking
    UPDATE bookings 
    SET status = 'active', 
        updated_at = NOW()
    WHERE id = booking_record.id;
    
    -- Create notification for user
    INSERT INTO notifications (user_id, title, message, type, action_url)
    VALUES (
      booking_record.user_id,
      'Booking Activated',
      'Your booking is now active! You can start using your reserved seat.',
      'success',
      '/student/dashboard'
    );
    
    activated_count := activated_count + 1;
    
    RAISE LOG 'Activated booking %', booking_record.id;
  END LOOP;
  
  RAISE LOG 'Activated % bookings', activated_count;
END;
$$;

-- Function to send booking reminders
CREATE OR REPLACE FUNCTION public.send_booking_reminders()
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  booking_record RECORD;
  reminder_count INTEGER := 0;
BEGIN
  RAISE LOG 'Starting booking reminder notifications';
  
  -- Send reminders for bookings starting tomorrow
  FOR booking_record IN 
    SELECT b.id, b.user_id, b.start_date, sh.name as study_hall_name
    FROM bookings b
    JOIN study_halls sh ON b.study_hall_id = sh.id
    WHERE b.status = 'confirmed' 
      AND b.payment_status = 'paid'
      AND b.start_date = CURRENT_DATE + INTERVAL '1 day'
      AND NOT EXISTS (
        SELECT 1 FROM notifications n 
        WHERE n.user_id = b.user_id 
          AND n.title = 'Booking Reminder'
          AND n.created_at::date = CURRENT_DATE
          AND n.message LIKE '%' || sh.name || '%'
      )
  LOOP
    -- Create reminder notification
    INSERT INTO notifications (user_id, title, message, type, action_url)
    VALUES (
      booking_record.user_id,
      'Booking Reminder',
      'Your booking at ' || booking_record.study_hall_name || ' starts tomorrow (' || booking_record.start_date || '). Get ready!',
      'info',
      '/student/dashboard'
    );
    
    reminder_count := reminder_count + 1;
    
    RAISE LOG 'Sent reminder for booking %', booking_record.id;
  END LOOP;
  
  RAISE LOG 'Sent % booking reminders', reminder_count;
END;
$$;

-- Master function to run all booking lifecycle checks
CREATE OR REPLACE FUNCTION public.run_booking_lifecycle_checks()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  RAISE LOG 'Starting comprehensive booking lifecycle checks';
  
  -- Run all lifecycle functions
  PERFORM public.auto_complete_expired_bookings();
  PERFORM public.auto_cancel_unpaid_bookings();
  PERFORM public.progress_booking_statuses();
  PERFORM public.send_booking_reminders();
  
  RAISE LOG 'Completed all booking lifecycle checks';
EXCEPTION
  WHEN OTHERS THEN
    RAISE LOG 'Error in booking lifecycle checks: %', SQLERRM;
END;
$$;

-- Enhanced trigger function for booking updates with proper status transitions
CREATE OR REPLACE FUNCTION public.enhanced_handle_booking_updates()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  RAISE LOG 'Enhanced booking update: % -> % (Payment: %)', OLD.status, NEW.status, NEW.payment_status;
  
  -- When booking becomes confirmed/active with payment, mark seat unavailable
  IF NEW.status IN ('confirmed', 'active') AND NEW.payment_status = 'paid' AND OLD.status != NEW.status THEN
    UPDATE public.seats 
    SET is_available = false 
    WHERE id = NEW.seat_id AND is_available = true;
    
    -- Send confirmation notification
    INSERT INTO notifications (user_id, title, message, type, action_url)
    VALUES (
      NEW.user_id,
      'Booking Confirmed',
      'Your booking has been confirmed! Payment received successfully.',
      'success',
      '/student/dashboard'
    );
    
    RAISE LOG 'Booking % confirmed and seat % reserved', NEW.id, NEW.seat_id;
  END IF;
  
  -- When booking is cancelled or completed, release seat
  IF NEW.status IN ('cancelled', 'completed') AND OLD.status != NEW.status THEN
    UPDATE public.seats 
    SET is_available = true 
    WHERE id = NEW.seat_id AND is_available = false;
    
    RAISE LOG 'Booking % ended (%) and seat % released', NEW.id, NEW.status, NEW.seat_id;
  END IF;
  
  -- Prevent invalid status transitions
  IF OLD.status = 'completed' AND NEW.status != 'completed' THEN
    RAISE EXCEPTION 'Cannot change status of completed booking';
  END IF;
  
  IF OLD.status = 'cancelled' AND NEW.status NOT IN ('cancelled', 'completed') THEN
    RAISE EXCEPTION 'Cannot reactivate cancelled booking';
  END IF;
  
  RETURN NEW;
END;
$$;

-- Drop old trigger and create new enhanced one
DROP TRIGGER IF EXISTS booking_status_trigger ON bookings;
CREATE TRIGGER enhanced_booking_status_trigger
  BEFORE UPDATE ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION enhanced_handle_booking_updates();

-- Schedule the booking lifecycle checks to run every hour
SELECT cron.schedule(
  'booking-lifecycle-checks',
  '0 * * * *', -- Every hour at minute 0
  $$
  SELECT public.run_booking_lifecycle_checks();
  $$
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_bookings_status_dates ON bookings(status, start_date, end_date, payment_status);
CREATE INDEX IF NOT EXISTS idx_bookings_created_unpaid ON bookings(created_at, payment_status) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_notifications_user_date ON notifications(user_id, created_at);

RAISE LOG 'Booking lifecycle management system initialized successfully';