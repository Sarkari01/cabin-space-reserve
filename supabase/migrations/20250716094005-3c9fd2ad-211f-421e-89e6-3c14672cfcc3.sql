-- Add scheduled_at field to news_posts table
ALTER TABLE public.news_posts 
ADD COLUMN scheduled_at timestamp with time zone DEFAULT NULL;

-- Update the status field to include 'scheduled' status
-- First, let's see what statuses we currently have
-- The status is currently just a text field, so we can add 'scheduled' as a valid value

-- Add an index for efficient querying of scheduled posts
CREATE INDEX idx_news_posts_scheduled_at ON public.news_posts(scheduled_at) WHERE scheduled_at IS NOT NULL;

-- Create a function to auto-publish scheduled posts
CREATE OR REPLACE FUNCTION public.auto_publish_scheduled_news()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  -- Update scheduled posts whose time has come to be published
  UPDATE public.news_posts 
  SET status = 'active',
      updated_at = now()
  WHERE status = 'scheduled' 
    AND scheduled_at IS NOT NULL 
    AND scheduled_at <= now();
    
  RAISE LOG 'Auto-published scheduled news posts';
END;
$$;

-- Note: The cron job to run this function would need to be set up separately
-- For now, this function can be called manually or triggered by the application