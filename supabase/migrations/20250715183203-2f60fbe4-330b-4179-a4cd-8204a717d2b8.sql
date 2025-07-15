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