-- Add location fields to study_halls table for Google Maps integration
ALTER TABLE study_halls 
ADD COLUMN latitude DECIMAL(10, 8),
ADD COLUMN longitude DECIMAL(11, 8),
ADD COLUMN formatted_address TEXT;

-- Create index for location-based queries
CREATE INDEX idx_study_halls_location ON study_halls USING btree (latitude, longitude);

-- Add distance calculation function using Haversine formula
CREATE OR REPLACE FUNCTION calculate_distance(
  lat1 DECIMAL(10, 8),
  lon1 DECIMAL(11, 8),
  lat2 DECIMAL(10, 8),
  lon2 DECIMAL(11, 8)
) RETURNS DECIMAL(8, 3)
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  earth_radius DECIMAL := 6371; -- Earth radius in kilometers
  dlat DECIMAL;
  dlon DECIMAL;
  a DECIMAL;
  c DECIMAL;
BEGIN
  dlat := radians(lat2 - lat1);
  dlon := radians(lon2 - lon1);
  a := sin(dlat/2) * sin(dlat/2) + cos(radians(lat1)) * cos(radians(lat2)) * sin(dlon/2) * sin(dlon/2);
  c := 2 * atan2(sqrt(a), sqrt(1-a));
  RETURN earth_radius * c;
END;
$$;

-- Function to get nearby study halls within a radius
CREATE OR REPLACE FUNCTION get_nearby_study_halls(
  user_lat DECIMAL(10, 8),
  user_lon DECIMAL(11, 8),
  radius_km DECIMAL DEFAULT 10
) RETURNS TABLE (
  id UUID,
  name TEXT,
  location TEXT,
  formatted_address TEXT,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  distance_km DECIMAL(8, 3),
  daily_price NUMERIC,
  weekly_price NUMERIC,
  monthly_price NUMERIC,
  amenities JSONB,
  image_url TEXT,
  merchant_id UUID
)
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    sh.id,
    sh.name,
    sh.location,
    sh.formatted_address,
    sh.latitude,
    sh.longitude,
    calculate_distance(user_lat, user_lon, sh.latitude, sh.longitude) as distance_km,
    sh.daily_price,
    sh.weekly_price,
    sh.monthly_price,
    sh.amenities,
    sh.image_url,
    sh.merchant_id
  FROM study_halls sh
  WHERE sh.status = 'active'
    AND sh.latitude IS NOT NULL 
    AND sh.longitude IS NOT NULL
    AND calculate_distance(user_lat, user_lon, sh.latitude, sh.longitude) <= radius_km
  ORDER BY distance_km ASC;
END;
$$;