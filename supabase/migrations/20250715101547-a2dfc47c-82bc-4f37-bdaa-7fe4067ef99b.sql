-- Initialize existing users with rewards and referral codes
-- This migration ensures all existing users have rewards and referral data

-- First, create rewards records for existing users who don't have them
INSERT INTO public.rewards (user_id, total_points, available_points, lifetime_earned, lifetime_redeemed)
SELECT p.id, 0, 0, 0, 0
FROM public.profiles p
WHERE NOT EXISTS (
  SELECT 1 FROM public.rewards r WHERE r.user_id = p.id
);

-- Create referral codes for existing users who don't have them
INSERT INTO public.referral_codes (user_id, code, status, total_referrals, successful_referrals, total_earnings)
SELECT p.id, public.generate_referral_code(), 'active', 0, 0, 0
FROM public.profiles p
WHERE NOT EXISTS (
  SELECT 1 FROM public.referral_codes rc WHERE rc.user_id = p.id
);

-- Create some sample coupons for testing
INSERT INTO public.coupons (
  code, title, description, type, value, min_booking_amount, max_discount,
  target_audience, usage_limit, user_usage_limit, start_date, end_date,
  status, created_by
) VALUES
  ('WELCOME10', 'Welcome Discount', 'Get 10% off your first booking', 'percentage', 10, 500, 200, 'new_users', 1000, 1, NOW(), NOW() + INTERVAL '30 days', 'active', (SELECT id FROM profiles WHERE role = 'admin' LIMIT 1)),
  ('FLAT50', 'Flat ₹50 Off', 'Flat ₹50 discount on any booking', 'flat', 50, 200, NULL, 'all', 500, 2, NOW(), NOW() + INTERVAL '15 days', 'active', (SELECT id FROM profiles WHERE role = 'admin' LIMIT 1)),
  ('STUDENT20', 'Student Special', '20% off for students', 'percentage', 20, 300, 500, 'all', 200, 1, NOW(), NOW() + INTERVAL '60 days', 'active', (SELECT id FROM profiles WHERE role = 'admin' LIMIT 1))
ON CONFLICT (code) DO NOTHING;

-- Create some sample reward transactions to show history
INSERT INTO public.reward_transactions (user_id, type, points, reason, booking_id)
SELECT 
  p.id,
  'earned',
  100,
  'Welcome bonus for joining the platform',
  NULL
FROM public.profiles p
WHERE p.role = 'student'
AND NOT EXISTS (
  SELECT 1 FROM public.reward_transactions rt 
  WHERE rt.user_id = p.id AND rt.reason = 'Welcome bonus for joining the platform'
)
LIMIT 5;

-- Update rewards table to reflect the welcome bonus
UPDATE public.rewards 
SET 
  total_points = total_points + 100,
  available_points = available_points + 100,
  lifetime_earned = lifetime_earned + 100,
  updated_at = NOW()
WHERE user_id IN (
  SELECT rt.user_id 
  FROM public.reward_transactions rt 
  WHERE rt.reason = 'Welcome bonus for joining the platform'
);