-- Create policy pages table
CREATE TABLE public.policy_pages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  meta_description TEXT,
  is_published BOOLEAN NOT NULL DEFAULT false,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  version INTEGER NOT NULL DEFAULT 1
);

-- Enable Row Level Security
ALTER TABLE public.policy_pages ENABLE ROW LEVEL SECURITY;

-- Create policies for policy pages
CREATE POLICY "Admins can manage all policy pages" 
ON public.policy_pages 
FOR ALL 
USING (is_admin())
WITH CHECK (is_admin());

CREATE POLICY "Public can view published policy pages" 
ON public.policy_pages 
FOR SELECT 
USING (is_published = true);

-- Create function to auto-generate slug from title
CREATE OR REPLACE FUNCTION public.generate_slug_from_title()
RETURNS TRIGGER AS $$
BEGIN
  -- Only generate slug if not provided
  IF NEW.slug IS NULL OR NEW.slug = '' THEN
    NEW.slug := lower(regexp_replace(regexp_replace(NEW.title, '[^a-zA-Z0-9\s]', '', 'g'), '\s+', '-', 'g'));
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create function to update version and timestamp
CREATE OR REPLACE FUNCTION public.update_policy_page_version()
RETURNS TRIGGER AS $$
BEGIN
  -- Increment version on content updates
  IF OLD.content IS DISTINCT FROM NEW.content THEN
    NEW.version := OLD.version + 1;
  END IF;
  
  NEW.updated_at := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
CREATE TRIGGER policy_pages_slug_trigger
  BEFORE INSERT ON public.policy_pages
  FOR EACH ROW
  EXECUTE FUNCTION public.generate_slug_from_title();

CREATE TRIGGER policy_pages_version_trigger
  BEFORE UPDATE ON public.policy_pages
  FOR EACH ROW
  EXECUTE FUNCTION public.update_policy_page_version();

-- Insert default policy page templates
INSERT INTO public.policy_pages (slug, title, content, created_by, is_published) VALUES
('privacy-policy', 'Privacy Policy', 
'<h1>Privacy Policy</h1>
<p><strong>Last Updated:</strong> [DATE]</p>

<h2>1. Information We Collect</h2>
<p>We collect information you provide directly to us, such as when you create an account, make a booking, or contact us for support.</p>

<h2>2. How We Use Your Information</h2>
<p>We use the information we collect to provide, maintain, and improve our services, process transactions, and communicate with you.</p>

<h2>3. Information Sharing</h2>
<p>We do not sell, trade, or otherwise transfer your personal information to third parties without your consent, except as described in this policy.</p>

<h2>4. Data Security</h2>
<p>We implement appropriate security measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction.</p>

<h2>5. Contact Us</h2>
<p>If you have any questions about this Privacy Policy, please contact us at [CONTACT_EMAIL].</p>',
(SELECT id FROM profiles WHERE role = 'admin' LIMIT 1), true),

('terms-conditions', 'Terms and Conditions', 
'<h1>Terms and Conditions</h1>
<p><strong>Last Updated:</strong> [DATE]</p>

<h2>1. Acceptance of Terms</h2>
<p>By accessing and using our service, you accept and agree to be bound by the terms and provision of this agreement.</p>

<h2>2. Service Description</h2>
<p>Our platform provides study hall booking and management services for students and merchants.</p>

<h2>3. User Accounts</h2>
<p>You are responsible for maintaining the confidentiality of your account and password and for restricting access to your account.</p>

<h2>4. Booking Terms</h2>
<p>All bookings are subject to availability and confirmation. Payment is required to confirm your booking.</p>

<h2>5. Cancellation Policy</h2>
<p>Cancellations must be made according to our cancellation policy. Refunds may be subject to processing fees.</p>

<h2>6. Contact Information</h2>
<p>For questions about these Terms and Conditions, please contact us at [CONTACT_EMAIL].</p>',
(SELECT id FROM profiles WHERE role = 'admin' LIMIT 1), true);

-- Add foreign key constraint
ALTER TABLE public.policy_pages 
ADD CONSTRAINT policy_pages_created_by_fkey 
FOREIGN KEY (created_by) REFERENCES public.profiles(id);