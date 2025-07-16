-- Add 'institution' role to the user_role enum
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'institution';

-- Create institutions table
CREATE TABLE IF NOT EXISTS public.institutions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name text NOT NULL,
  email text NOT NULL UNIQUE,
  phone text,
  address text,
  website text,
  description text,
  logo_url text,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Add institution_id column to news_posts for attribution
ALTER TABLE public.news_posts 
ADD COLUMN IF NOT EXISTS institution_id uuid REFERENCES public.institutions(id) ON DELETE SET NULL;

-- Enable RLS on institutions table
ALTER TABLE public.institutions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for institutions table
CREATE POLICY "Admins can manage all institutions" 
ON public.institutions 
FOR ALL 
TO authenticated 
USING (is_admin())
WITH CHECK (is_admin());

CREATE POLICY "Institutions can view and update their own record" 
ON public.institutions 
FOR ALL 
TO authenticated 
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Create RLS policy for news_posts with institution attribution
CREATE POLICY "Institutions can manage their own news posts" 
ON public.news_posts 
FOR ALL 
TO authenticated 
USING (
  institution_id IN (
    SELECT id FROM public.institutions WHERE user_id = auth.uid()
  )
)
WITH CHECK (
  institution_id IN (
    SELECT id FROM public.institutions WHERE user_id = auth.uid()
  )
);

-- Create trigger for updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_institutions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_institutions_updated_at
  BEFORE UPDATE ON public.institutions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_institutions_updated_at();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_institutions_user_id ON public.institutions(user_id);
CREATE INDEX IF NOT EXISTS idx_institutions_status ON public.institutions(status);
CREATE INDEX IF NOT EXISTS idx_news_posts_institution_id ON public.news_posts(institution_id);