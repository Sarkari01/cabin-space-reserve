-- Create FAQ management system
CREATE TABLE public.faq_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.faq_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  category_id UUID REFERENCES public.faq_categories(id) ON DELETE SET NULL,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  target_audience TEXT NOT NULL DEFAULT 'all',
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create contact submissions system
CREATE TABLE public.contact_submissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  source TEXT DEFAULT 'landing_page',
  status TEXT NOT NULL DEFAULT 'new',
  priority TEXT NOT NULL DEFAULT 'normal',
  assigned_to UUID REFERENCES public.profiles(id),
  response_sent BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.faq_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.faq_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_submissions ENABLE ROW LEVEL SECURITY;

-- FAQ policies
CREATE POLICY "Anyone can view active FAQ categories" ON public.faq_categories 
FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage FAQ categories" ON public.faq_categories 
FOR ALL USING (is_admin());

CREATE POLICY "Anyone can view active FAQ items" ON public.faq_items 
FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage FAQ items" ON public.faq_items 
FOR ALL USING (is_admin());

-- Contact submissions policies
CREATE POLICY "Anyone can create contact submissions" ON public.contact_submissions 
FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can view all contact submissions" ON public.contact_submissions 
FOR SELECT USING (is_admin());

CREATE POLICY "Admins can update contact submissions" ON public.contact_submissions 
FOR UPDATE USING (is_admin());

-- Add updated_at triggers
CREATE TRIGGER update_faq_categories_updated_at
  BEFORE UPDATE ON public.faq_categories
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_faq_items_updated_at
  BEFORE UPDATE ON public.faq_items
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_contact_submissions_updated_at
  BEFORE UPDATE ON public.contact_submissions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default FAQ categories and items
INSERT INTO public.faq_categories (name, description, display_order) VALUES 
('General', 'General questions about our platform', 1),
('Booking', 'Questions about booking and reservations', 2),
('Payment', 'Payment and billing related questions', 3),
('Account', 'Account management and profile questions', 4);

INSERT INTO public.faq_items (category_id, question, answer, display_order, target_audience) VALUES 
((SELECT id FROM public.faq_categories WHERE name = 'General'), 
 'What is StudySpace Platform?', 
 'StudySpace Platform is a comprehensive booking system that connects students with quality study halls and spaces. We provide a seamless way to find, book, and manage study space reservations.', 
 1, 'all'),
 
((SELECT id FROM public.faq_categories WHERE name = 'General'), 
 'How do I find study halls near me?', 
 'You can use our location-based search feature to find study halls in your area. Simply enter your location or allow location access, and we will show you nearby options with availability and pricing.', 
 2, 'all'),

((SELECT id FROM public.faq_categories WHERE name = 'Booking'), 
 'How do I make a booking?', 
 'To make a booking, browse available study halls, select your preferred dates and seat, and proceed to payment. You will receive a confirmation email with your booking details.', 
 1, 'student'),

((SELECT id FROM public.faq_categories WHERE name = 'Booking'), 
 'Can I cancel or modify my booking?', 
 'Yes, you can cancel or modify your booking through your dashboard. Cancellation policies may vary by study hall, so please check the specific terms before booking.', 
 2, 'student'),

((SELECT id FROM public.faq_categories WHERE name = 'Payment'), 
 'What payment methods do you accept?', 
 'We accept various payment methods including credit/debit cards, digital wallets, and bank transfers. All payments are processed securely through our trusted payment partners.', 
 1, 'all'),

((SELECT id FROM public.faq_categories WHERE name = 'Account'), 
 'How do I create an account?', 
 'You can create an account by clicking the "Sign Up" button and providing your email, phone number, and other basic information. Verification may be required for certain features.', 
 1, 'all');

-- Update business_settings to include social media and enhanced settings
ALTER TABLE public.business_settings 
ADD COLUMN social_facebook TEXT,
ADD COLUMN social_twitter TEXT,
ADD COLUMN social_instagram TEXT,
ADD COLUMN social_linkedin TEXT,
ADD COLUMN social_youtube TEXT,
ADD COLUMN newsletter_enabled BOOLEAN DEFAULT true,
ADD COLUMN newsletter_description TEXT DEFAULT 'Stay updated with the latest news and offers',
ADD COLUMN contact_address TEXT,
ADD COLUMN contact_hours TEXT DEFAULT 'Monday - Friday: 9:00 AM - 6:00 PM',
ADD COLUMN map_embed_url TEXT;