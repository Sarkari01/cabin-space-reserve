-- Add QR code support to study_halls table
ALTER TABLE public.study_halls 
ADD COLUMN IF NOT EXISTS qr_code_url text,
ADD COLUMN IF NOT EXISTS qr_booking_enabled boolean DEFAULT true;

-- Add guest booking support to bookings table  
ALTER TABLE public.bookings
ADD COLUMN IF NOT EXISTS guest_name text,
ADD COLUMN IF NOT EXISTS guest_phone text,
ADD COLUMN IF NOT EXISTS guest_email text;

-- Make user_id nullable for guest bookings
ALTER TABLE public.bookings ALTER COLUMN user_id DROP NOT NULL;

-- Create storage bucket for QR codes
INSERT INTO storage.buckets (id, name, public) 
VALUES ('qr-codes', 'qr-codes', true)
ON CONFLICT (id) DO NOTHING;

-- Create policies for QR code storage
CREATE POLICY "QR codes are publicly accessible" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'qr-codes');

CREATE POLICY "Merchants can upload QR codes for their study halls" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'qr-codes' AND auth.uid() IS NOT NULL);

-- Update bookings RLS policies to support guest bookings
CREATE POLICY "Guest bookings are viewable by study hall merchants" 
ON public.bookings 
FOR SELECT 
USING (
  user_id IS NULL AND 
  study_hall_id IN (
    SELECT study_halls.id
    FROM study_halls
    WHERE study_halls.merchant_id = auth.uid()
  )
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_bookings_guest_phone ON public.bookings(guest_phone);
CREATE INDEX IF NOT EXISTS idx_study_halls_qr_booking_enabled ON public.study_halls(qr_booking_enabled);