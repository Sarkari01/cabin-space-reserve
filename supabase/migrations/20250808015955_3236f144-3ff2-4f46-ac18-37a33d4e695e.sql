
-- Fix: avoid casting 'vacated' to enum cabin_booking_status inside the trigger log line
-- by making both branches text. This prevents the enum cast error when vacating.

CREATE OR REPLACE FUNCTION public.handle_cabin_booking_updates()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- When booking becomes active and paid, mark cabin as occupied (if not vacated)
  IF NEW.status = 'active'
     AND NEW.payment_status = 'paid'
     AND OLD.status != 'active'
     AND COALESCE(NEW.is_vacated, false) = false
  THEN
    UPDATE public.cabins 
    SET status = 'occupied', updated_at = now()
    WHERE id = NEW.cabin_id;

    RAISE LOG 'Cabin % marked as occupied for booking %',
      NEW.cabin_id, NEW.id;
  END IF;

  -- When booking is completed, cancelled, or becomes vacated, mark cabin as available
  IF (NEW.status IN ('completed', 'cancelled') AND OLD.status != NEW.status)
     OR (COALESCE(NEW.is_vacated, false) = true AND COALESCE(OLD.is_vacated, false) = false)
  THEN
    UPDATE public.cabins 
    SET status = 'available', updated_at = now()
    WHERE id = NEW.cabin_id;

    -- IMPORTANT: Cast both CASE branches to text to avoid enum casting errors
    RAISE LOG 'Cabin % marked as available for booking % (reason: %)', 
      NEW.cabin_id, NEW.id, 
      CASE 
        WHEN COALESCE(NEW.is_vacated, false) THEN 'vacated'::text
        ELSE NEW.status::text
      END;
  END IF;

  RETURN NEW;
END;
$$;
