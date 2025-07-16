-- Make user_id nullable in notifications table for system-wide notifications
ALTER TABLE public.notifications 
ALTER COLUMN user_id DROP NOT NULL;

-- Update RLS policies to handle system notifications (NULL user_id)
DROP POLICY IF EXISTS "Admins can create notifications" ON public.notifications;
DROP POLICY IF EXISTS "System can create popup notifications" ON public.notifications;

-- Allow admins to create any notifications including system-wide ones
CREATE POLICY "Admins can create all notifications including system-wide" 
ON public.notifications 
FOR INSERT 
WITH CHECK (
  is_admin() OR 
  (popup_enabled = true AND user_id IS NULL) OR
  (popup_enabled = true AND user_id = auth.uid())
);

-- Update the get_active_popup_notifications function to handle NULL user_id for system notifications
CREATE OR REPLACE FUNCTION public.get_active_popup_notifications(p_user_id uuid, p_user_role text DEFAULT 'student'::text)
RETURNS TABLE(id uuid, title text, message text, image_url text, button_text text, button_url text, priority integer, created_at timestamp with time zone, duration_seconds integer)
LANGUAGE plpgsql
STABLE
AS $function$
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
    n.created_at,
    n.duration_seconds
  FROM public.notifications n
  WHERE n.popup_enabled = true
    AND n.active = true
    AND (n.expires_at IS NULL OR n.expires_at > now())
    AND (n.schedule_time IS NULL OR n.schedule_time <= now())
    AND (
      -- System-wide notifications (user_id is NULL)
      n.user_id IS NULL OR
      -- User-specific notifications
      n.user_id = p_user_id
    )
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
$function$;