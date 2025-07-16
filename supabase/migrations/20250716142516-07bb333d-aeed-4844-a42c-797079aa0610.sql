-- Add maintenance mode fields to business_settings table
ALTER TABLE public.business_settings 
ADD COLUMN maintenance_mode_enabled BOOLEAN DEFAULT false,
ADD COLUMN maintenance_message TEXT DEFAULT 'We are currently performing maintenance. Please check back later.',
ADD COLUMN maintenance_estimated_return TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- Update existing business_settings record if it exists
UPDATE public.business_settings 
SET 
  maintenance_mode_enabled = false,
  maintenance_message = 'We are currently performing maintenance. Please check back later.',
  maintenance_estimated_return = NULL
WHERE maintenance_mode_enabled IS NULL;