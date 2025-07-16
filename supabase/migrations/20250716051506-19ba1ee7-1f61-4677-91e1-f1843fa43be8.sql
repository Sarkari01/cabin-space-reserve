-- Create storage bucket for popup notification images
INSERT INTO storage.buckets (id, name, public) 
VALUES ('popup-notification-images', 'popup-notification-images', true);

-- Create storage policies for popup notification images
CREATE POLICY "Anyone can view popup notification images" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'popup-notification-images');

CREATE POLICY "Admins can upload popup notification images" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'popup-notification-images' AND is_admin());

CREATE POLICY "Admins can update popup notification images" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'popup-notification-images' AND is_admin());

CREATE POLICY "Admins can delete popup notification images" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'popup-notification-images' AND is_admin());

-- Clean up any notifications with blob: URLs which are invalid
UPDATE notifications 
SET image_url = NULL 
WHERE image_url LIKE 'blob:%' AND popup_enabled = true;