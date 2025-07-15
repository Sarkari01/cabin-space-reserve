-- Extend user_role enum to include incharge
ALTER TYPE user_role ADD VALUE 'incharge';

-- Create incharges table
CREATE TABLE public.incharges (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  merchant_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  mobile TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
  assigned_study_halls JSONB NOT NULL DEFAULT '[]'::jsonb,
  permissions JSONB NOT NULL DEFAULT '{"view_bookings": true, "manage_bookings": true, "view_transactions": true}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID NOT NULL REFERENCES public.profiles(id),
  invitation_token TEXT,
  invitation_sent_at TIMESTAMP WITH TIME ZONE,
  account_activated BOOLEAN NOT NULL DEFAULT false
);

-- Enable RLS on incharges table
ALTER TABLE public.incharges ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for incharges table
CREATE POLICY "Merchants can view their own incharges" 
ON public.incharges 
FOR SELECT 
USING (merchant_id = auth.uid());

CREATE POLICY "Merchants can create incharges" 
ON public.incharges 
FOR INSERT 
WITH CHECK (merchant_id = auth.uid() AND created_by = auth.uid());

CREATE POLICY "Merchants can update their own incharges" 
ON public.incharges 
FOR UPDATE 
USING (merchant_id = auth.uid());

CREATE POLICY "Admins can manage all incharges" 
ON public.incharges 
FOR ALL 
USING (is_admin());

CREATE POLICY "Incharges can view their own record" 
ON public.incharges 
FOR SELECT 
USING (email = (SELECT email FROM profiles WHERE id = auth.uid()));

-- Create incharge activity logs table
CREATE TABLE public.incharge_activity_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  incharge_id UUID NOT NULL REFERENCES public.incharges(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  details JSONB,
  booking_id UUID REFERENCES public.bookings(id),
  study_hall_id UUID REFERENCES public.study_halls(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on activity logs
ALTER TABLE public.incharge_activity_logs ENABLE ROW LEVEL SECURITY;

-- RLS policies for activity logs
CREATE POLICY "Merchants can view logs for their incharges" 
ON public.incharge_activity_logs 
FOR SELECT 
USING (incharge_id IN (SELECT id FROM incharges WHERE merchant_id = auth.uid()));

CREATE POLICY "Admins can view all activity logs" 
ON public.incharge_activity_logs 
FOR SELECT 
USING (is_admin());

CREATE POLICY "System can create activity logs" 
ON public.incharge_activity_logs 
FOR INSERT 
WITH CHECK (true);

-- Update existing RLS policies to handle incharge role
CREATE POLICY "Incharges can view bookings for assigned study halls" 
ON public.bookings 
FOR SELECT 
USING (
  study_hall_id IN (
    SELECT jsonb_array_elements_text(assigned_study_halls)::uuid 
    FROM incharges 
    WHERE email = (SELECT email FROM profiles WHERE id = auth.uid())
    AND status = 'active'
  )
);

CREATE POLICY "Incharges can update bookings for assigned study halls" 
ON public.bookings 
FOR UPDATE 
USING (
  study_hall_id IN (
    SELECT jsonb_array_elements_text(assigned_study_halls)::uuid 
    FROM incharges 
    WHERE email = (SELECT email FROM profiles WHERE id = auth.uid())
    AND status = 'active'
  )
);

CREATE POLICY "Incharges can view transactions for assigned study halls" 
ON public.transactions 
FOR SELECT 
USING (
  booking_id IN (
    SELECT b.id FROM bookings b
    WHERE b.study_hall_id IN (
      SELECT jsonb_array_elements_text(assigned_study_halls)::uuid 
      FROM incharges 
      WHERE email = (SELECT email FROM profiles WHERE id = auth.uid())
      AND status = 'active'
    )
  )
);

-- Create trigger for updated_at
CREATE TRIGGER update_incharges_updated_at
BEFORE UPDATE ON public.incharges
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to generate invitation token
CREATE OR REPLACE FUNCTION public.generate_invitation_token()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN encode(gen_random_bytes(32), 'hex');
END;
$$;