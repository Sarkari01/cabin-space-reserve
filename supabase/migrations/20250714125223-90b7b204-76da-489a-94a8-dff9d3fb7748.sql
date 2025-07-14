-- Fix study halls status constraint to match application logic
-- Drop the existing constraint that only allows 'active', 'pending', 'suspended'
ALTER TABLE public.study_halls DROP CONSTRAINT IF EXISTS study_halls_status_check;

-- Add new constraint that allows 'active' and 'inactive' to match the activate/deactivate functionality
ALTER TABLE public.study_halls ADD CONSTRAINT study_halls_status_check 
CHECK (status IN ('active', 'inactive'));

-- Update any existing 'pending' or 'suspended' statuses to 'active' to prevent data issues
UPDATE public.study_halls 
SET status = 'active' 
WHERE status NOT IN ('active', 'inactive');