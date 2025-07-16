-- Add active column to notifications table for toggle functionality
ALTER TABLE public.notifications 
ADD COLUMN IF NOT EXISTS active boolean DEFAULT true;

-- Create index for better performance on active notifications
CREATE INDEX IF NOT EXISTS idx_notifications_active ON public.notifications(active);

-- Update RLS policies for proper popup notification access

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON public.notifications;

-- Add comprehensive admin policies
CREATE POLICY "Admins can manage all notifications" 
ON public.notifications 
FOR ALL 
USING (is_admin()) 
WITH CHECK (is_admin());

-- Allow users to view popup notifications targeted at their audience (not just their own)
CREATE POLICY "Users can view targeted popup notifications" 
ON public.notifications 
FOR SELECT 
USING (
  (popup_enabled = true AND active = true) AND
  (expires_at IS NULL OR expires_at > now()) AND
  (schedule_time IS NULL OR schedule_time <= now()) AND
  (
    target_audience = 'all_users' OR
    target_audience IN (
      SELECT CASE 
        WHEN p.role = 'admin' THEN 'admin'
        WHEN p.role = 'merchant' THEN 'merchants'
        WHEN p.role = 'student' THEN 'students'
        WHEN p.role = 'telemarketing_executive' THEN 'telemarketing'
        WHEN p.role = 'pending_payments_caller' THEN 'pending_payments'
        WHEN p.role = 'customer_care_executive' THEN 'customer_care'
        WHEN p.role = 'general_administrator' THEN 'general_admin'
        WHEN p.role = 'settlement_manager' THEN 'settlement_manager'
        ELSE 'students'
      END
      FROM profiles p WHERE p.id = auth.uid()
    ) OR
    target_audience IN ('student', 'merchant', 'students', 'merchants')
  )
);

-- Allow users to update interaction with popup notifications
CREATE POLICY "Users can update popup notification interactions" 
ON public.notifications 
FOR UPDATE 
USING (
  popup_enabled = true AND
  (target_audience = 'all_users' OR target_audience IN (
    SELECT CASE 
      WHEN p.role = 'admin' THEN 'admin'
      WHEN p.role = 'merchant' THEN 'merchants'
      WHEN p.role = 'student' THEN 'students'
      ELSE 'students'
    END
    FROM profiles p WHERE p.id = auth.uid()
  ))
);

-- Update existing notifications to be active by default
UPDATE public.notifications 
SET active = true 
WHERE active IS NULL;