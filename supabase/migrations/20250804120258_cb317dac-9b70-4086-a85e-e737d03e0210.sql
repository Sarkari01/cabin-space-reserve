-- Create storage bucket for private hall images
INSERT INTO storage.buckets (id, name, public) 
VALUES ('private-hall-images', 'private-hall-images', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for private hall images
CREATE POLICY "Public can view private hall images" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'private-hall-images');

CREATE POLICY "Authenticated users can upload private hall images" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'private-hall-images' AND auth.role() = 'authenticated');

CREATE POLICY "Users can update their own private hall images" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'private-hall-images' AND auth.role() = 'authenticated');

CREATE POLICY "Users can delete their own private hall images" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'private-hall-images' AND auth.role() = 'authenticated');