-- Create merchant_profiles table for extended merchant business information
CREATE TABLE public.merchant_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  merchant_id UUID NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  
  -- Basic Business Info (Required)
  phone TEXT,
  business_address TEXT,
  trade_license_number TEXT,
  trade_license_document_url TEXT,
  
  -- Bank Account Details (Required)
  account_holder_name TEXT,
  bank_name TEXT,
  account_number TEXT,
  ifsc_code TEXT,
  
  -- KYC & Identity Verification (Optional)
  gstin_pan TEXT,
  business_email TEXT,
  
  -- Onboarding Status Tracking
  is_onboarding_complete BOOLEAN NOT NULL DEFAULT false,
  onboarding_step INTEGER NOT NULL DEFAULT 1,
  verification_status TEXT NOT NULL DEFAULT 'pending',
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create merchant_documents table for file uploads
CREATE TABLE public.merchant_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  merchant_profile_id UUID NOT NULL REFERENCES public.merchant_profiles(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL, -- 'trade_license', 'kyc_document', 'additional_document'
  file_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  mime_type TEXT NOT NULL,
  verification_status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
  verification_notes TEXT,
  uploaded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create storage bucket for merchant documents
INSERT INTO storage.buckets (id, name, public) VALUES ('merchant-documents', 'merchant-documents', false);

-- Enable RLS on merchant_profiles
ALTER TABLE public.merchant_profiles ENABLE ROW LEVEL SECURITY;

-- Enable RLS on merchant_documents  
ALTER TABLE public.merchant_documents ENABLE ROW LEVEL SECURITY;

-- RLS Policies for merchant_profiles
CREATE POLICY "Merchants can view their own profile"
ON public.merchant_profiles
FOR SELECT
USING (merchant_id = auth.uid());

CREATE POLICY "Merchants can create their own profile"
ON public.merchant_profiles
FOR INSERT
WITH CHECK (merchant_id = auth.uid());

CREATE POLICY "Merchants can update their own profile"
ON public.merchant_profiles
FOR UPDATE
USING (merchant_id = auth.uid());

CREATE POLICY "Admins can view all merchant profiles"
ON public.merchant_profiles
FOR SELECT
USING (is_admin());

CREATE POLICY "Admins can update all merchant profiles"
ON public.merchant_profiles
FOR UPDATE
USING (is_admin());

-- RLS Policies for merchant_documents
CREATE POLICY "Merchants can view their own documents"
ON public.merchant_documents
FOR SELECT
USING (merchant_profile_id IN (
  SELECT id FROM public.merchant_profiles WHERE merchant_id = auth.uid()
));

CREATE POLICY "Merchants can create their own documents"
ON public.merchant_documents
FOR INSERT
WITH CHECK (merchant_profile_id IN (
  SELECT id FROM public.merchant_profiles WHERE merchant_id = auth.uid()
));

CREATE POLICY "Merchants can update their own documents"
ON public.merchant_documents
FOR UPDATE
USING (merchant_profile_id IN (
  SELECT id FROM public.merchant_profiles WHERE merchant_id = auth.uid()
));

CREATE POLICY "Admins can view all merchant documents"
ON public.merchant_documents
FOR SELECT
USING (is_admin());

CREATE POLICY "Admins can update all merchant documents"
ON public.merchant_documents
FOR UPDATE
USING (is_admin());

-- Storage policies for merchant-documents bucket
CREATE POLICY "Merchants can upload their own documents"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'merchant-documents' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Merchants can view their own documents"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'merchant-documents' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Admins can view all merchant documents"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'merchant-documents' AND 
  is_admin()
);

-- Create trigger to update updated_at timestamp
CREATE TRIGGER update_merchant_profiles_updated_at
BEFORE UPDATE ON public.merchant_profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to automatically create merchant profile after merchant signup
CREATE OR REPLACE FUNCTION public.create_merchant_profile()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Only create profile for merchants
  IF NEW.role = 'merchant' THEN
    INSERT INTO public.merchant_profiles (merchant_id)
    VALUES (NEW.id);
  END IF;
  RETURN NEW;
END;
$$;

-- Create trigger to auto-create merchant profile
CREATE TRIGGER on_merchant_signup
AFTER INSERT ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.create_merchant_profile();