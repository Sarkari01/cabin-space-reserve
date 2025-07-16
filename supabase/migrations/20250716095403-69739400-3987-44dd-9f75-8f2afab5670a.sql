-- Add creator tracking fields to news_posts table
ALTER TABLE public.news_posts 
ADD COLUMN created_by uuid REFERENCES public.profiles(id),
ADD COLUMN created_by_type text DEFAULT 'admin';

-- Create enum for creator types
CREATE TYPE public.creator_type AS ENUM ('admin', 'institution', 'telemarketing_executive');

-- Update the column to use the enum
ALTER TABLE public.news_posts 
ALTER COLUMN created_by_type TYPE creator_type USING created_by_type::creator_type;

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
      NEW.created_by_type := 'admin';
    WHEN 'institution' THEN
      NEW.created_by_type := 'institution';
    WHEN 'telemarketing_executive' THEN
      NEW.created_by_type := 'telemarketing_executive';
    ELSE
      NEW.created_by_type := 'admin';
  END CASE;
  
  RETURN NEW;
END;
$$;

-- Create trigger to automatically set creator
CREATE TRIGGER set_news_creator_trigger
  BEFORE INSERT ON public.news_posts
  FOR EACH ROW
  EXECUTE FUNCTION public.set_news_creator();