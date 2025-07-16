-- Update get_active_popup_notifications function to include duration_seconds
CREATE OR REPLACE FUNCTION public.get_active_popup_notifications(p_user_id uuid, p_user_role text DEFAULT 'student')
RETURNS TABLE(
  id uuid,
  title text,
  message text,
  image_url text,
  button_text text,
  button_url text,
  priority integer,
  created_at timestamp with time zone,
  duration_seconds integer
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
    n.created_at,
    n.duration_seconds
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