-- Create the qr-codes storage bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'qr-codes', 
  'qr-codes', 
  true, 
  1048576, -- 1MB limit
  ARRAY['image/png', 'image/jpeg']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 1048576,
  allowed_mime_types = ARRAY['image/png', 'image/jpeg'];

-- Create storage policies for QR codes bucket
CREATE POLICY "QR codes are publicly readable" ON storage.objects
FOR SELECT USING (bucket_id = 'qr-codes');

CREATE POLICY "Authenticated users can upload QR codes" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'qr-codes' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update QR codes" ON storage.objects
FOR UPDATE USING (bucket_id = 'qr-codes' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete QR codes" ON storage.objects
FOR DELETE USING (bucket_id = 'qr-codes' AND auth.role() = 'authenticated');