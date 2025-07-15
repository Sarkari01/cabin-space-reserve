-- First, update any existing users with operational roles to telemarketing_executive
UPDATE profiles 
SET role = 'telemarketing_executive'::user_role 
WHERE role IN ('pending_payments_caller', 'customer_care_executive', 'settlement_manager', 'general_administrator');

-- Update admin_user_profiles permissions structure for telemarketing executives
UPDATE admin_user_profiles 
SET permissions = jsonb_build_object(
  'merchant_onboarding', true,
  'payment_recovery', true,
  'customer_support', true,
  'settlement_management', true
)
WHERE permissions = '{}'::jsonb OR permissions IS NULL;