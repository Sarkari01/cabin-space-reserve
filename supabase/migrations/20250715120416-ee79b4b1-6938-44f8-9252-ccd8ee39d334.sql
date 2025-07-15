-- Create storage policies for merchant-documents bucket to allow merchant uploads
CREATE POLICY "Merchants can upload their own documents" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'merchant-documents' 
  AND auth.uid()::text = (storage.foldername(name))[1]
  AND EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'merchant'
  )
);

CREATE POLICY "Merchants can view their own documents" 
ON storage.objects 
FOR SELECT 
USING (
  bucket_id = 'merchant-documents' 
  AND auth.uid()::text = (storage.foldername(name))[1]
  AND EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'merchant'
  )
);

CREATE POLICY "Merchants can update their own documents" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'merchant-documents' 
  AND auth.uid()::text = (storage.foldername(name))[1]
  AND EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'merchant'
  )
);

CREATE POLICY "Merchants can delete their own documents" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'merchant-documents' 
  AND auth.uid()::text = (storage.foldername(name))[1]
  AND EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'merchant'
  )
);

CREATE POLICY "Admins can manage all merchant documents" 
ON storage.objects 
FOR ALL 
USING (
  bucket_id = 'merchant-documents' 
  AND EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
);