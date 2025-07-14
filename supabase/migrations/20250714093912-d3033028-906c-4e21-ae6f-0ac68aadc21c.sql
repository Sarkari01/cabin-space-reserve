-- Insert sample subscription data for testing merchant subscriptions
-- First, let's check if we have any merchants in the profiles table
-- We'll insert a sample subscription for testing

-- Insert sample subscription for a merchant (assuming there's a merchant user)
INSERT INTO public.merchant_subscriptions (
    merchant_id,
    plan_id,
    status,
    start_date,
    end_date,
    payment_method,
    auto_renew,
    last_payment_date,
    next_payment_date
) SELECT 
    profiles.id,
    plans.id,
    'active',
    now() - interval '15 days',
    now() + interval '15 days',
    'offline',
    true,
    now() - interval '15 days',
    now() + interval '15 days'
FROM profiles
CROSS JOIN subscription_plans plans
WHERE profiles.role = 'merchant'
  AND plans.name = 'Premium'
  AND NOT EXISTS (
    SELECT 1 FROM merchant_subscriptions 
    WHERE merchant_id = profiles.id
  )
LIMIT 1;

-- Insert some sample transactions for merchant subscriptions
INSERT INTO public.subscription_transactions (
    merchant_id,
    subscription_id,
    amount, 
    payment_method,
    status,
    payment_id
) SELECT 
    ms.merchant_id,
    ms.id,
    sp.price,
    'offline',
    'completed',
    'OFFLINE_' || substr(ms.id::text, 1, 8)
FROM merchant_subscriptions ms
JOIN subscription_plans sp ON ms.plan_id = sp.id
WHERE NOT EXISTS (
    SELECT 1 FROM subscription_transactions 
    WHERE subscription_id = ms.id
)
LIMIT 5;