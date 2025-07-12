-- Phase 1: Database Schema Update - Remove Razorpay and fix EKQR fields

-- First, drop the old business_settings table and recreate with correct schema
DROP TABLE IF EXISTS public.business_settings CASCADE;

-- Create new business_settings table with only EKQR and offline
CREATE TABLE public.business_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ekqr_enabled BOOLEAN NOT NULL DEFAULT true,
  ekqr_api_key TEXT DEFAULT '3e323980-8939-433c-b8c5-4e1775e917d5',
  offline_enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.business_settings ENABLE ROW LEVEL SECURITY;

-- Create policies for admin access
CREATE POLICY "Admin full access to business settings" 
ON public.business_settings 
FOR ALL 
USING (is_admin()) 
WITH CHECK (is_admin());

-- Insert default settings
INSERT INTO public.business_settings (ekqr_enabled, ekqr_api_key, offline_enabled)
VALUES (true, '3e323980-8939-433c-b8c5-4e1775e917d5', true);

-- Create trigger for updated_at
CREATE TRIGGER update_business_settings_updated_at
BEFORE UPDATE ON public.business_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Phase 2: Clean up transactions - remove Razorpay references and demo data
DELETE FROM public.transactions WHERE payment_method = 'razorpay';
DELETE FROM public.transactions WHERE payment_method = 'demo';

-- Phase 3: Clean up demo users and related data
DELETE FROM public.transactions WHERE booking_id IN (
  SELECT id FROM public.bookings WHERE user_id IN (
    SELECT id FROM public.profiles WHERE email LIKE '%demo%' OR full_name LIKE '%demo%'
  )
);

DELETE FROM public.bookings WHERE user_id IN (
  SELECT id FROM public.profiles WHERE email LIKE '%demo%' OR full_name LIKE '%demo%'
);

DELETE FROM public.profiles WHERE email LIKE '%demo%' OR full_name LIKE '%demo%';