-- 1) Create private_hall_favorites table with RLS
CREATE TABLE IF NOT EXISTS public.private_hall_favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  private_hall_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_user_hall UNIQUE (user_id, private_hall_id)
);

-- Enable RLS
ALTER TABLE public.private_hall_favorites ENABLE ROW LEVEL SECURITY;

-- Policies
DO $$
BEGIN
  -- Users can manage their own favorites
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'private_hall_favorites' AND policyname = 'Users can manage their own private hall favorites'
  ) THEN
    CREATE POLICY "Users can manage their own private hall favorites"
    ON public.private_hall_favorites
    FOR ALL
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());
  END IF;

  -- Admins can view all
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'private_hall_favorites' AND policyname = 'Admins can view all private hall favorites'
  ) THEN
    CREATE POLICY "Admins can view all private hall favorites"
    ON public.private_hall_favorites
    FOR SELECT
    USING (is_admin());
  END IF;
END $$;

-- 2) Ensure a public storage bucket for private hall images exists
INSERT INTO storage.buckets (id, name, public)
VALUES ('private-hall-images', 'private-hall-images', true)
ON CONFLICT (id) DO NOTHING;

-- Public read access to images in this bucket
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Public can read private hall images'
  ) THEN
    CREATE POLICY "Public can read private hall images"
    ON storage.objects
    FOR SELECT
    USING (bucket_id = 'private-hall-images');
  END IF;
END $$;
