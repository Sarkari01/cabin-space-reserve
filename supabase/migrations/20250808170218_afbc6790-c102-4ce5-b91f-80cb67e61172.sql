
-- 1) Add platform fee configuration to business_settings
ALTER TABLE public.business_settings
  ADD COLUMN IF NOT EXISTS platform_fee_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS platform_fee_type text NOT NULL DEFAULT 'percent',
  ADD COLUMN IF NOT EXISTS platform_fee_value numeric NOT NULL DEFAULT 0;

-- 1a) Validation trigger for platform fee settings
CREATE OR REPLACE FUNCTION public.validate_platform_fee_settings()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
BEGIN
  -- type validation
  IF NEW.platform_fee_type NOT IN ('flat', 'percent') THEN
    RAISE EXCEPTION 'Invalid platform_fee_type: %, must be flat or percent', NEW.platform_fee_type;
  END IF;

  -- non-negative value
  IF NEW.platform_fee_value < 0 THEN
    RAISE EXCEPTION 'platform_fee_value must be >= 0';
  END IF;

  -- percent max validation
  IF NEW.platform_fee_type = 'percent' AND NEW.platform_fee_value > 100 THEN
    RAISE EXCEPTION 'platform_fee_value must be <= 100 when type is percent';
  END IF;

  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS trg_validate_platform_fee_settings ON public.business_settings;

CREATE TRIGGER trg_validate_platform_fee_settings
BEFORE INSERT OR UPDATE ON public.business_settings
FOR EACH ROW
EXECUTE FUNCTION public.validate_platform_fee_settings();

-- 2) Track platform fee per booking (study hall and cabin)
ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS platform_fee_amount numeric NOT NULL DEFAULT 0;

ALTER TABLE public.cabin_bookings
  ADD COLUMN IF NOT EXISTS platform_fee_amount numeric NOT NULL DEFAULT 0;

-- 3) Track platform fee per transaction for reporting/analytics
ALTER TABLE public.transactions
  ADD COLUMN IF NOT EXISTS platform_fee_amount numeric NOT NULL DEFAULT 0;
