-- Add brand identity fields to business_settings table
ALTER TABLE public.business_settings 
ADD COLUMN IF NOT EXISTS logo_url text,
ADD COLUMN IF NOT EXISTS favicon_url text,
ADD COLUMN IF NOT EXISTS brand_name text DEFAULT 'StudySpace Platform',
ADD COLUMN IF NOT EXISTS support_email text,
ADD COLUMN IF NOT EXISTS support_phone text,
ADD COLUMN IF NOT EXISTS website_url text,
ADD COLUMN IF NOT EXISTS tagline text;

-- Create storage bucket for brand assets
INSERT INTO storage.buckets (id, name, public) 
VALUES ('brand-assets', 'brand-assets', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for brand assets
CREATE POLICY "Brand assets are publicly viewable" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'brand-assets');

CREATE POLICY "Admins can upload brand assets" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'brand-assets' AND (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
));

CREATE POLICY "Admins can update brand assets" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'brand-assets' AND (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
));

CREATE POLICY "Admins can delete brand assets" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'brand-assets' AND (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
));