
-- 1) Clean up any orphan user_id values before adding the FK
UPDATE public.cabin_bookings cb
SET user_id = NULL
WHERE user_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = cb.user_id
  );

-- 2) Add a foreign key from cabin_bookings.user_id -> profiles.id
--    Use ON DELETE SET NULL to preserve guest bookings and not break history
ALTER TABLE public.cabin_bookings
  ADD CONSTRAINT cabin_bookings_user_id_fkey
  FOREIGN KEY (user_id)
  REFERENCES public.profiles(id)
  ON DELETE SET NULL;

-- 3) Optional: add an index for better query performance on user_id
--    (Safe if it already exists – we check first)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_indexes
    WHERE schemaname = 'public'
      AND indexname = 'idx_cabin_bookings_user_id'
  ) THEN
    CREATE INDEX idx_cabin_bookings_user_id
      ON public.cabin_bookings (user_id);
  END IF;
END$$;
