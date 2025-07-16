-- Enhance notifications table for pop-up notification system
ALTER TABLE public.notifications 
ADD COLUMN IF NOT EXISTS image_url TEXT,
ADD COLUMN IF NOT EXISTS target_audience TEXT DEFAULT 'all_users',
ADD COLUMN IF NOT EXISTS schedule_time TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS button_text TEXT,
ADD COLUMN IF NOT EXISTS button_url TEXT,
ADD COLUMN IF NOT EXISTS popup_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS priority INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS shown_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS click_count INTEGER DEFAULT 0;

-- Create index for better performance on popup queries
CREATE INDEX IF NOT EXISTS idx_notifications_popup_enabled ON public.notifications(popup_enabled) WHERE popup_enabled = true;
CREATE INDEX IF NOT EXISTS idx_notifications_target_audience ON public.notifications(target_audience);
CREATE INDEX IF NOT EXISTS idx_notifications_schedule_time ON public.notifications(schedule_time);
CREATE INDEX IF NOT EXISTS idx_notifications_expires_at ON public.notifications(expires_at);

-- Create a table to track which pop-ups have been shown to which users
CREATE TABLE IF NOT EXISTS public.popup_user_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  notification_id UUID NOT NULL REFERENCES public.notifications(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  shown_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  dismissed_at TIMESTAMP WITH TIME ZONE,
  clicked_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(notification_id, user_id)
);

-- Enable RLS on the new table
ALTER TABLE public.popup_user_interactions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for popup_user_interactions
CREATE POLICY "Users can view their own popup interactions" 
ON public.popup_user_interactions 
FOR SELECT 
USING (user_id = auth.uid());

CREATE POLICY "System can create popup interactions" 
ON public.popup_user_interactions 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Users can update their own popup interactions" 
ON public.popup_user_interactions 
FOR UPDATE 
USING (user_id = auth.uid());

CREATE POLICY "Admins can view all popup interactions" 
ON public.popup_user_interactions 
FOR ALL 
USING (is_admin());

-- Update notifications policies to support popup functionality
CREATE POLICY "System can create popup notifications" 
ON public.notifications 
FOR INSERT 
WITH CHECK (popup_enabled = true);

-- Create function to get active popup notifications for a user
CREATE OR REPLACE FUNCTION public.get_active_popup_notifications(p_user_id UUID, p_user_role TEXT DEFAULT 'student')
RETURNS TABLE(
  id UUID,
  title TEXT,
  message TEXT,
  image_url TEXT,
  button_text TEXT,
  button_url TEXT,
  priority INTEGER,
  created_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    n.id,
    n.title,
    n.message,
    n.image_url,
    n.button_text,
    n.button_url,
    n.priority,
    n.created_at
  FROM public.notifications n
  WHERE n.popup_enabled = true
    AND (n.expires_at IS NULL OR n.expires_at > now())
    AND (n.schedule_time IS NULL OR n.schedule_time <= now())
    AND (
      n.target_audience = 'all_users' OR
      n.target_audience = p_user_role OR
      (n.target_audience = 'students' AND p_user_role = 'student') OR
      (n.target_audience = 'merchants' AND p_user_role = 'merchant')
    )
    AND NOT EXISTS (
      SELECT 1 FROM public.popup_user_interactions pui
      WHERE pui.notification_id = n.id 
        AND pui.user_id = p_user_id
        AND pui.dismissed_at IS NOT NULL
    )
  ORDER BY n.priority DESC, n.created_at DESC;
END;
$$;