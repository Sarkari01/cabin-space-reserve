-- Phase 6: Database Schema & Types Cleanup for Monthly-Only Transformation

-- Remove daily and weekly columns from merchant_pricing_plans table
ALTER TABLE public.merchant_pricing_plans 
DROP COLUMN IF EXISTS daily_enabled,
DROP COLUMN IF EXISTS daily_price,
DROP COLUMN IF EXISTS weekly_enabled,
DROP COLUMN IF EXISTS weekly_price;

-- Update the calculate_booking_amount function to work with monthly-only pricing
CREATE OR REPLACE FUNCTION public.calculate_monthly_only_booking_amount(
  p_start_date date, 
  p_end_date date, 
  p_monthly_price numeric
)
RETURNS TABLE(amount numeric, days integer, months integer, method text)
LANGUAGE plpgsql
IMMUTABLE
AS $function$
DECLARE
  v_days INTEGER;
  v_months INTEGER;
  v_final_amount NUMERIC;
BEGIN
  -- Calculate number of days (inclusive)
  v_days := p_end_date - p_start_date + 1;
  
  -- Calculate months needed (always round up for billing)
  v_months := CEIL(v_days::NUMERIC / 30);
  
  -- Calculate final amount based on months
  v_final_amount := v_months * p_monthly_price;
  
  RETURN QUERY SELECT v_final_amount, v_days, v_months, 'monthly'::text;
END;
$function$;

-- Update get_nearby_study_halls_with_pricing to only return monthly pricing
CREATE OR REPLACE FUNCTION public.get_nearby_study_halls_with_monthly_pricing(
  p_latitude double precision,
  p_longitude double precision,
  p_radius_km double precision DEFAULT 10
)
RETURNS TABLE(
  id uuid,
  name text,
  description text,
  location text,
  formatted_address text,
  latitude double precision,
  longitude double precision,
  monthly_price numeric,
  image_url text,
  amenities text[],
  merchant_id uuid,
  status text,
  total_seats integer,
  average_rating numeric,
  total_reviews integer,
  distance_km double precision
)
LANGUAGE plpgsql
STABLE
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    sh.id,
    sh.name,
    sh.description,
    sh.location,
    sh.formatted_address,
    sh.latitude,
    sh.longitude,
    sh.monthly_price,
    sh.image_url,
    sh.amenities,
    sh.merchant_id,
    sh.status,
    sh.total_seats,
    sh.average_rating,
    sh.total_reviews,
    ST_Distance(
      ST_MakePoint(sh.longitude, sh.latitude)::geography,
      ST_MakePoint(p_longitude, p_latitude)::geography
    ) / 1000 as distance_km
  FROM public.study_halls sh
  WHERE sh.status = 'active'
    AND sh.latitude IS NOT NULL 
    AND sh.longitude IS NOT NULL
    AND ST_DWithin(
      ST_MakePoint(sh.longitude, sh.latitude)::geography,
      ST_MakePoint(p_longitude, p_latitude)::geography,
      p_radius_km * 1000
    )
  ORDER BY distance_km;
END;
$function$;

-- Create a view for monthly pricing plans compatibility
CREATE OR REPLACE VIEW public.monthly_pricing_view AS
SELECT 
  id,
  merchant_id,
  study_hall_id,
  monthly_enabled,
  monthly_price,
  created_at,
  updated_at
FROM public.merchant_pricing_plans
WHERE monthly_enabled = true;

-- Drop the old calculate_booking_amount function that used daily/weekly pricing
DROP FUNCTION IF EXISTS public.calculate_booking_amount(date, date, numeric, numeric, numeric);

-- Create a simplified booking amount calculator that only works with monthly pricing
CREATE OR REPLACE FUNCTION public.calculate_simple_booking_amount(
  p_start_date date,
  p_end_date date,
  p_monthly_price numeric
)
RETURNS TABLE(amount numeric, days integer, months integer)
LANGUAGE plpgsql
IMMUTABLE
AS $function$
DECLARE
  v_days INTEGER;
  v_months INTEGER;
  v_amount NUMERIC;
BEGIN
  -- Calculate number of days (inclusive)
  v_days := p_end_date - p_start_date + 1;
  
  -- Calculate months (round up)
  v_months := CEIL(v_days::NUMERIC / 30);
  
  -- Calculate amount
  v_amount := v_months * p_monthly_price;
  
  RETURN QUERY SELECT v_amount, v_days, v_months;
END;
$function$;