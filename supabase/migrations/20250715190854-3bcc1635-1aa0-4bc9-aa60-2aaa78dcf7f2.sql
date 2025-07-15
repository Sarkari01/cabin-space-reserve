-- First, remove the default constraint temporarily
ALTER TABLE profiles ALTER COLUMN role DROP DEFAULT;

-- Update any existing users with operational roles to telemarketing_executive
UPDATE profiles 
SET role = 'telemarketing_executive'::user_role 
WHERE role IN ('pending_payments_caller', 'customer_care_executive', 'settlement_manager', 'general_administrator');

-- Create a new enum with only the 4 core roles
CREATE TYPE user_role_new AS ENUM ('student', 'merchant', 'admin', 'telemarketing_executive');

-- Update the profiles table to use the new enum
ALTER TABLE profiles 
ALTER COLUMN role TYPE user_role_new 
USING role::text::user_role_new;

-- Drop the old enum and rename the new one
DROP TYPE user_role;
ALTER TYPE user_role_new RENAME TO user_role;

-- Restore the default value
ALTER TABLE profiles ALTER COLUMN role SET DEFAULT 'student'::user_role;

-- Update admin_user_profiles permissions structure for telemarketing executives
UPDATE admin_user_profiles 
SET permissions = jsonb_build_object(
  'merchant_onboarding', true,
  'payment_recovery', true,
  'customer_support', true,
  'settlement_management', true
)
WHERE permissions = '{}'::jsonb OR permissions IS NULL;