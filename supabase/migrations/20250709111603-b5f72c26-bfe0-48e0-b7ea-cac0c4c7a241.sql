-- Create enum for target audience
CREATE TYPE public.banner_target_audience AS ENUM ('user', 'merchant', 'both');

-- Create enum for banner status
CREATE TYPE public.banner_status AS ENUM ('active', 'inactive');

-- Create banners table
CREATE TABLE public.banners (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  image_url TEXT NOT NULL,
  title TEXT,
  description TEXT,
  target_audience banner_target_audience NOT NULL DEFAULT 'both',
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  end_date DATE,
  status banner_status NOT NULL DEFAULT 'active',
  priority INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.banners ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Admins can do everything
CREATE POLICY "Admins can manage all banners" 
ON public.banners 
FOR ALL 
USING (is_admin())
WITH CHECK (is_admin());

-- Users can view active banners within date range that target them
CREATE POLICY "Users can view relevant banners" 
ON public.banners 
FOR SELECT 
USING (
  status = 'active' AND
  (start_date <= CURRENT_DATE) AND
  (end_date IS NULL OR end_date >= CURRENT_DATE) AND
  (target_audience = 'user' OR target_audience = 'both')
);

-- Merchants can view active banners within date range that target them
CREATE POLICY "Merchants can view relevant banners" 
ON public.banners 
FOR SELECT 
USING (
  status = 'active' AND
  (start_date <= CURRENT_DATE) AND
  (end_date IS NULL OR end_date >= CURRENT_DATE) AND
  (target_audience = 'merchant' OR target_audience = 'both') AND
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'merchant')
);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_banners_updated_at
BEFORE UPDATE ON public.banners
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for banner images
INSERT INTO storage.buckets (id, name, public) VALUES ('banner-images', 'banner-images', true);

-- Create storage policies for banner images
CREATE POLICY "Admins can upload banner images" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'banner-images' AND is_admin());

CREATE POLICY "Admins can update banner images" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'banner-images' AND is_admin());

CREATE POLICY "Admins can delete banner images" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'banner-images' AND is_admin());

CREATE POLICY "Banner images are publicly accessible" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'banner-images');