-- Create missing merchant profiles for existing merchants
INSERT INTO public.merchant_profiles (merchant_id)
SELECT p.id 
FROM public.profiles p
LEFT JOIN public.merchant_profiles mp ON p.id = mp.merchant_id
WHERE p.role = 'merchant' AND mp.id IS NULL;

-- Log the operation
DO $$
DECLARE
  created_count INTEGER;
BEGIN
  GET DIAGNOSTICS created_count = ROW_COUNT;
  RAISE LOG 'Created % missing merchant profiles', created_count;
END $$;