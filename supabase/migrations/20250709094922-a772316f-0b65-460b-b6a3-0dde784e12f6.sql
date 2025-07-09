-- Update admin@studyspace.com role from merchant to admin
UPDATE public.profiles 
SET role = 'admin'
WHERE email = 'admin@studyspace.com';