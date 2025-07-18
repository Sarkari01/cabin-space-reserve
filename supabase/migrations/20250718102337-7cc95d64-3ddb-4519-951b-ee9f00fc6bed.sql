
-- Add SMS configuration fields to business_settings table
ALTER TABLE public.business_settings 
ADD COLUMN sms_enabled BOOLEAN DEFAULT false,
ADD COLUMN sms_username TEXT DEFAULT 'lavetstechnologies',
ADD COLUMN sms_password TEXT DEFAULT 'Password1!',
ADD COLUMN sms_sender_id TEXT DEFAULT 'DUEDSK',
ADD COLUMN sms_merchant_enabled BOOLEAN DEFAULT true,
ADD COLUMN sms_user_enabled BOOLEAN DEFAULT true,
ADD COLUMN sms_otp_enabled BOOLEAN DEFAULT true,
ADD COLUMN sms_booking_confirmations_enabled BOOLEAN DEFAULT true,
ADD COLUMN sms_login_credentials_enabled BOOLEAN DEFAULT true;

-- Create SMS templates table
CREATE TABLE public.sms_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  purpose TEXT NOT NULL UNIQUE,
  template_name TEXT NOT NULL,
  message_template TEXT NOT NULL,
  template_id TEXT,
  variables JSONB DEFAULT '[]'::jsonb,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create SMS logs table
CREATE TABLE public.sms_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  recipient_phone TEXT NOT NULL,
  message TEXT NOT NULL,
  template_purpose TEXT,
  template_id TEXT,
  status TEXT DEFAULT 'pending',
  response_data JSONB,
  error_message TEXT,
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  user_id UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add phone number field to profiles table
ALTER TABLE public.profiles 
ADD COLUMN phone TEXT,
ADD COLUMN phone_verified BOOLEAN DEFAULT false,
ADD COLUMN sms_notifications_enabled BOOLEAN DEFAULT true;

-- Enable RLS on new tables
ALTER TABLE public.sms_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sms_logs ENABLE ROW LEVEL SECURITY;

-- RLS policies for sms_templates
CREATE POLICY "Admins can manage SMS templates"
ON public.sms_templates
FOR ALL
USING (is_admin())
WITH CHECK (is_admin());

CREATE POLICY "Anyone can view active SMS templates"
ON public.sms_templates
FOR SELECT
USING (is_active = true);

-- RLS policies for sms_logs
CREATE POLICY "Admins can view all SMS logs"
ON public.sms_logs
FOR SELECT
USING (is_admin());

CREATE POLICY "Users can view their own SMS logs"
ON public.sms_logs
FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "System can create SMS logs"
ON public.sms_logs
FOR INSERT
WITH CHECK (true);

-- Add updated_at triggers
CREATE TRIGGER update_sms_templates_updated_at
BEFORE UPDATE ON public.sms_templates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default SMS templates
INSERT INTO public.sms_templates (purpose, template_name, message_template, variables) VALUES
('merchant_created', 'Merchant Welcome', 'Welcome {name}! Your merchant account is ready. Login: {email}, Pass: {password}', '["name", "email", "password"]'),
('user_created', 'User Welcome', 'Hi {name}, your DueDesk account is live. Login: {email}, Pass: {password}', '["name", "email", "password"]'),
('booking_confirmation', 'Booking Confirmed', 'Booking ID {booking_id} confirmed for {start_date} to {end_date}. Enjoy your study time! – DueDesk', '["booking_id", "start_date", "end_date"]'),
('otp_verification', 'OTP Verification', 'Use OTP {otp} to verify your number. Valid for 10 mins. Do not share it. – DueDesk', '["otp"]'),
('password_reset', 'Password Reset', 'Your DueDesk password reset is successful. New password is {password}.', '["password"]'),
('merchant_approved', 'Account Approved', 'Congratulations {name}! Your merchant account has been approved. You can now start listing your study halls.', '["name"]'),
('booking_alert_merchant', 'New Booking Alert', 'New booking received! {user_name} booked {study_hall} from {start_date} to {end_date}. Booking ID: {booking_id}', '["user_name", "study_hall", "start_date", "end_date", "booking_id"]');
