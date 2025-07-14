-- Add amenities column to study_halls table
ALTER TABLE public.study_halls 
ADD COLUMN amenities JSONB DEFAULT '[]'::jsonb;

-- Add index for amenities search
CREATE INDEX idx_study_halls_amenities ON public.study_halls USING gin(amenities);

-- Add comment for documentation
COMMENT ON COLUMN public.study_halls.amenities IS 'Array of amenities available in the study hall (e.g., WiFi, AC, Parking)';