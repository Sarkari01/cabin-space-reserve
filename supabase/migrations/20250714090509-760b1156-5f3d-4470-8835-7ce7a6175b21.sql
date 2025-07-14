-- Create subscription_plans table for admin-managed pricing plans
CREATE TABLE public.subscription_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  duration TEXT NOT NULL CHECK (duration IN ('monthly', 'yearly')),
  features JSONB NOT NULL DEFAULT '[]',
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  max_study_halls INTEGER DEFAULT 5,
  max_bookings_per_month INTEGER DEFAULT 100,
  priority_support BOOLEAN DEFAULT false,
  analytics_access BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create merchant_subscriptions table to track merchant subscriptions
CREATE TABLE public.merchant_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES public.subscription_plans(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'expired', 'cancelled')),
  start_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  end_date TIMESTAMPTZ,
  auto_renew BOOLEAN DEFAULT true,
  payment_method TEXT DEFAULT 'offline',
  last_payment_date TIMESTAMPTZ,
  next_payment_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(merchant_id) -- Each merchant can only have one active subscription
);

-- Create subscription_transactions table for subscription payments
CREATE TABLE public.subscription_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id UUID NOT NULL REFERENCES public.merchant_subscriptions(id) ON DELETE CASCADE,
  merchant_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
  payment_method TEXT NOT NULL DEFAULT 'offline',
  payment_id TEXT,
  payment_data JSONB,
  transaction_number INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.merchant_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for subscription_plans
CREATE POLICY "Admins can manage subscription plans" ON public.subscription_plans
FOR ALL USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY "Everyone can view active subscription plans" ON public.subscription_plans
FOR SELECT USING (status = 'active');

-- RLS Policies for merchant_subscriptions
CREATE POLICY "Admins can view all subscriptions" ON public.merchant_subscriptions
FOR SELECT USING (is_admin());

CREATE POLICY "Merchants can view their own subscription" ON public.merchant_subscriptions
FOR SELECT USING (merchant_id = auth.uid());

CREATE POLICY "Admins can manage all subscriptions" ON public.merchant_subscriptions
FOR ALL USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY "Merchants can update their own subscription" ON public.merchant_subscriptions
FOR UPDATE USING (merchant_id = auth.uid());

-- RLS Policies for subscription_transactions
CREATE POLICY "Admins can view all subscription transactions" ON public.subscription_transactions
FOR SELECT USING (is_admin());

CREATE POLICY "Merchants can view their own subscription transactions" ON public.subscription_transactions
FOR SELECT USING (merchant_id = auth.uid());

CREATE POLICY "System can create subscription transactions" ON public.subscription_transactions
FOR INSERT WITH CHECK (merchant_id = auth.uid());

CREATE POLICY "Admins can manage all subscription transactions" ON public.subscription_transactions
FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- Create triggers for updated_at columns
CREATE TRIGGER update_subscription_plans_updated_at
BEFORE UPDATE ON public.subscription_plans
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_merchant_subscriptions_updated_at
BEFORE UPDATE ON public.merchant_subscriptions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_subscription_transactions_updated_at
BEFORE UPDATE ON public.subscription_transactions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create trigger for auto-generating transaction numbers
CREATE TRIGGER auto_generate_subscription_transaction_number
BEFORE INSERT ON public.subscription_transactions
FOR EACH ROW
EXECUTE FUNCTION public.auto_generate_transaction_number();

-- Insert default subscription plans
INSERT INTO public.subscription_plans (name, price, duration, features, max_study_halls, max_bookings_per_month, priority_support, analytics_access) VALUES
('Basic', 299.00, 'monthly', '["Up to 5 study halls", "Basic analytics", "Email support"]', 5, 100, false, false),
('Professional', 599.00, 'monthly', '["Up to 15 study halls", "Advanced analytics", "Priority support", "Custom branding"]', 15, 500, true, true),
('Enterprise', 999.00, 'monthly', '["Unlimited study halls", "Full analytics suite", "24/7 support", "Custom integrations", "API access"]', 999, 9999, true, true);

-- Insert yearly versions with discount
INSERT INTO public.subscription_plans (name, price, duration, features, max_study_halls, max_bookings_per_month, priority_support, analytics_access) VALUES
('Basic Annual', 2990.00, 'yearly', '["Up to 5 study halls", "Basic analytics", "Email support", "2 months free"]', 5, 100, false, false),
('Professional Annual', 5990.00, 'yearly', '["Up to 15 study halls", "Advanced analytics", "Priority support", "Custom branding", "2 months free"]', 15, 500, true, true),
('Enterprise Annual', 9990.00, 'yearly', '["Unlimited study halls", "Full analytics suite", "24/7 support", "Custom integrations", "API access", "2 months free"]', 999, 9999, true, true);