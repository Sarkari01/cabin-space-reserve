-- Add duration_seconds and trigger_event fields to notifications table
ALTER TABLE public.notifications 
ADD COLUMN duration_seconds INTEGER DEFAULT 10,
ADD COLUMN trigger_event TEXT DEFAULT 'general';

-- Create index for faster queries on trigger_event
CREATE INDEX idx_notifications_trigger_event ON public.notifications(trigger_event);

-- Update existing notifications to have default values
UPDATE public.notifications 
SET duration_seconds = 10, trigger_event = 'general' 
WHERE duration_seconds IS NULL OR trigger_event IS NULL;