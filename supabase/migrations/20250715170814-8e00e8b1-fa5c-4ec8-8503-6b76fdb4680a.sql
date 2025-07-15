-- Add password management fields to incharges table
ALTER TABLE public.incharges 
ADD COLUMN password_set_by_merchant boolean DEFAULT false,
ADD COLUMN password_last_changed timestamp with time zone DEFAULT null,
ADD COLUMN auth_method text DEFAULT 'invitation' CHECK (auth_method IN ('invitation', 'password'));

-- Update existing records to use invitation method
UPDATE public.incharges SET auth_method = 'invitation' WHERE auth_method IS NULL;