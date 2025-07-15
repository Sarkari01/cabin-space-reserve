-- Add new operational roles to the user_role enum
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'telemarketing_executive';
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'pending_payments_caller';
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'customer_care_executive';
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'settlement_manager';
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'general_administrator';

-- Create admin_user_profiles table for extended operational user data
CREATE TABLE public.admin_user_profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  department TEXT,
  hire_date DATE DEFAULT CURRENT_DATE,
  employee_id TEXT UNIQUE,
  manager_id UUID REFERENCES public.profiles(id),
  permissions JSONB DEFAULT '{}',
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create call_logs table for tracking all outbound calls and follow-ups
CREATE TABLE public.call_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  caller_id UUID NOT NULL REFERENCES public.profiles(id),
  contact_type TEXT NOT NULL CHECK (contact_type IN ('merchant', 'user')),
  contact_id UUID NOT NULL,
  call_purpose TEXT NOT NULL CHECK (call_purpose IN ('onboarding', 'payment_follow_up', 'support', 'general')),
  call_status TEXT NOT NULL CHECK (call_status IN ('completed', 'no_answer', 'busy', 'invalid_number', 'callback_requested')),
  call_outcome TEXT CHECK (call_outcome IN ('interested', 'not_interested', 'call_later', 'payment_confirmed', 'issue_resolved', 'escalated')),
  notes TEXT,
  follow_up_date DATE,
  call_duration INTEGER, -- in seconds
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create support_tickets table for customer care ticket management
CREATE TABLE public.support_tickets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ticket_number INTEGER UNIQUE,
  user_id UUID REFERENCES public.profiles(id),
  merchant_id UUID REFERENCES public.profiles(id),
  assigned_to UUID REFERENCES public.profiles(id),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('technical', 'billing', 'booking', 'general', 'complaint')),
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed', 'escalated')),
  resolution TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  resolved_at TIMESTAMP WITH TIME ZONE
);

-- Auto-generate ticket numbers
CREATE OR REPLACE FUNCTION auto_generate_ticket_number()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.ticket_number IS NULL THEN
        NEW.ticket_number := generate_short_id('support_tickets', 'ticket_number');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_auto_generate_ticket_number
    BEFORE INSERT ON public.support_tickets
    FOR EACH ROW
    EXECUTE FUNCTION auto_generate_ticket_number();

-- Enable RLS on all new tables
ALTER TABLE public.admin_user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.call_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;

-- RLS policies for admin_user_profiles
CREATE POLICY "Admins can manage all admin user profiles" ON public.admin_user_profiles
FOR ALL USING (is_admin());

CREATE POLICY "Users can view their own admin profile" ON public.admin_user_profiles
FOR SELECT USING (user_id = auth.uid());

-- RLS policies for call_logs
CREATE POLICY "Admins can view all call logs" ON public.call_logs
FOR ALL USING (is_admin());

CREATE POLICY "Operational users can create call logs" ON public.call_logs
FOR INSERT WITH CHECK (
  caller_id = auth.uid() AND 
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'telemarketing_executive', 'pending_payments_caller', 'customer_care_executive', 'general_administrator')
  )
);

CREATE POLICY "Operational users can view their own call logs" ON public.call_logs
FOR SELECT USING (
  caller_id = auth.uid() OR 
  is_admin()
);

-- RLS policies for support_tickets
CREATE POLICY "Admins can manage all support tickets" ON public.support_tickets
FOR ALL USING (is_admin());

CREATE POLICY "Customer care can manage tickets" ON public.support_tickets
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND role IN ('customer_care_executive', 'general_administrator')
  )
);

CREATE POLICY "Users can view their own tickets" ON public.support_tickets
FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Merchants can view their tickets" ON public.support_tickets
FOR SELECT USING (merchant_id = auth.uid());

CREATE POLICY "Users can create tickets" ON public.support_tickets
FOR INSERT WITH CHECK (user_id = auth.uid() OR merchant_id = auth.uid());

-- Add updated_at triggers
CREATE TRIGGER update_admin_user_profiles_updated_at
    BEFORE UPDATE ON public.admin_user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_support_tickets_updated_at
    BEFORE UPDATE ON public.support_tickets
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_call_logs_caller_id ON public.call_logs(caller_id);
CREATE INDEX idx_call_logs_contact_type_id ON public.call_logs(contact_type, contact_id);
CREATE INDEX idx_call_logs_call_purpose ON public.call_logs(call_purpose);
CREATE INDEX idx_call_logs_created_at ON public.call_logs(created_at);

CREATE INDEX idx_support_tickets_user_id ON public.support_tickets(user_id);
CREATE INDEX idx_support_tickets_merchant_id ON public.support_tickets(merchant_id);
CREATE INDEX idx_support_tickets_assigned_to ON public.support_tickets(assigned_to);
CREATE INDEX idx_support_tickets_status ON public.support_tickets(status);
CREATE INDEX idx_support_tickets_created_at ON public.support_tickets(created_at);