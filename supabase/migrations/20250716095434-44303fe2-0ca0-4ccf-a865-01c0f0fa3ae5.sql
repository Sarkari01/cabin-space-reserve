-- Add creator tracking fields to news_posts table
ALTER TABLE public.news_posts 
ADD COLUMN created_by uuid REFERENCES public.profiles(id);

-- Create enum for creator types
CREATE TYPE public.creator_type AS ENUM ('admin', 'institution', 'telemarketing_executive');

-- Add created_by_type column with proper enum type
ALTER TABLE public.news_posts 
ADD COLUMN created_by_type creator_type DEFAULT 'admin'::creator_type;

-- Set default creator for existing posts (assign to first admin user)
UPDATE public.news_posts 
SET created_by = (
  SELECT id FROM public.profiles 
  WHERE role = 'admin' 
  LIMIT 1
)
WHERE created_by IS NULL;

-- Create function to automatically set creator on insert
CREATE OR REPLACE FUNCTION public.set_news_creator()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  user_role text;
BEGIN
  -- Get the user's role
  SELECT role INTO user_role
  FROM public.profiles
  WHERE id = auth.uid();
  
  -- Set creator fields based on user role
  NEW.created_by := auth.uid();
  
  CASE user_role
    WHEN 'admin' THEN
      NEW.created_by_type := 'admin'::creator_type;
    WHEN 'institution' THEN
      NEW.created_by_type := 'institution'::creator_type;
    WHEN 'telemarketing_executive' THEN
      NEW.created_by_type := 'telemarketing_executive'::creator_type;
    ELSE
      NEW.created_by_type := 'admin'::creator_type;
  END CASE;
  
  RETURN NEW;
END;
$$;

-- Create trigger to automatically set creator
CREATE TRIGGER set_news_creator_trigger
  BEFORE INSERT ON public.news_posts
  FOR EACH ROW
  EXECUTE FUNCTION public.set_news_creator();