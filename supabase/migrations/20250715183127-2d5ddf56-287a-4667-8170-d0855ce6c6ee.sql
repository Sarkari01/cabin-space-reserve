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

-- Add updated_at triggers
CREATE TRIGGER update_admin_user_profiles_updated_at
    BEFORE UPDATE ON public.admin_user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_support_tickets_updated_at
    BEFORE UPDATE ON public.support_tickets
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();