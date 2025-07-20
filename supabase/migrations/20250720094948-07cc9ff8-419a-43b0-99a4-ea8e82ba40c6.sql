
-- Create merchant_pricing_plans table
CREATE TABLE public.merchant_pricing_plans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  merchant_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  study_hall_id UUID NOT NULL REFERENCES public.study_halls(id) ON DELETE CASCADE,
  daily_enabled BOOLEAN NOT NULL DEFAULT true,
  daily_price NUMERIC(10,2),
  weekly_enabled BOOLEAN NOT NULL DEFAULT true,
  weekly_price NUMERIC(10,2),
  monthly_enabled BOOLEAN NOT NULL DEFAULT true,
  monthly_price NUMERIC(10,2),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(merchant_id, study_hall_id)
);

-- Enable Row Level Security
ALTER TABLE public.merchant_pricing_plans ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Merchants can view their own pricing plans" 
  ON public.merchant_pricing_plans 
  FOR SELECT 
  USING (merchant_id = auth.uid());

CREATE POLICY "Merchants can create their own pricing plans" 
  ON public.merchant_pricing_plans 
  FOR INSERT 
  WITH CHECK (merchant_id = auth.uid());

CREATE POLICY "Merchants can update their own pricing plans" 
  ON public.merchant_pricing_plans 
  FOR UPDATE 
  USING (merchant_id = auth.uid());

CREATE POLICY "Merchants can delete their own pricing plans" 
  ON public.merchant_pricing_plans 
  FOR DELETE 
  USING (merchant_id = auth.uid());

CREATE POLICY "Admins can manage all pricing plans" 
  ON public.merchant_pricing_plans 
  FOR ALL 
  USING (is_admin())
  WITH CHECK (is_admin());

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION public.update_merchant_pricing_plans_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_merchant_pricing_plans_updated_at
  BEFORE UPDATE ON public.merchant_pricing_plans
  FOR EACH ROW
  EXECUTE FUNCTION public.update_merchant_pricing_plans_updated_at();

-- Populate with existing study hall pricing (migration)
INSERT INTO public.merchant_pricing_plans (
  merchant_id, 
  study_hall_id, 
  daily_enabled, 
  daily_price, 
  weekly_enabled, 
  weekly_price, 
  monthly_enabled, 
  monthly_price
)
SELECT 
  sh.merchant_id,
  sh.id,
  true,
  sh.daily_price,
  true,
  sh.weekly_price,
  true,
  sh.monthly_price
FROM public.study_halls sh
WHERE sh.merchant_id IS NOT NULL
ON CONFLICT (merchant_id, study_hall_id) DO NOTHING;
