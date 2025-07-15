-- Update booking rewards function to use admin-defined settings
CREATE OR REPLACE FUNCTION public.award_booking_rewards()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  reward_points INTEGER;
  is_first_booking BOOLEAN;
  business_settings RECORD;
BEGIN
  -- Only award rewards when booking is completed and paid
  IF NEW.status = 'completed' AND NEW.payment_status = 'paid' AND 
     (OLD.status != 'completed' OR OLD.payment_status != 'paid') THEN
    
    -- Get business settings for rewards configuration
    SELECT rewards_enabled, points_per_booking, points_profile_complete
    INTO business_settings
    FROM public.business_settings
    LIMIT 1;
    
    -- Check if rewards are enabled
    IF business_settings.rewards_enabled IS FALSE THEN
      RETURN NEW;
    END IF;
    
    -- Use admin-defined points per booking with fallback
    reward_points := COALESCE(business_settings.points_per_booking, 50);
    
    -- Check if this is user's first completed booking
    SELECT NOT EXISTS(
      SELECT 1 FROM public.bookings 
      WHERE user_id = NEW.user_id 
        AND status = 'completed' 
        AND payment_status = 'paid'
        AND id != NEW.id
    ) INTO is_first_booking;
    
    -- Award booking completion reward
    PERFORM public.update_user_rewards(
      NEW.user_id, 
      reward_points, 
      'earned', 
      'Booking completion reward',
      NEW.id
    );
    
    -- Award first booking bonus using admin settings
    IF is_first_booking THEN
      PERFORM public.update_user_rewards(
        NEW.user_id, 
        COALESCE(business_settings.points_profile_complete, 100), 
        'earned', 
        'First booking bonus',
        NEW.id
      );
    END IF;
    
    RAISE LOG 'Awarded % reward points to user % for booking %', reward_points, NEW.user_id, NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$;