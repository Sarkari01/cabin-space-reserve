-- Add reward system settings to business_settings table
ALTER TABLE business_settings ADD COLUMN IF NOT EXISTS rewards_enabled BOOLEAN DEFAULT true;
ALTER TABLE business_settings ADD COLUMN IF NOT EXISTS rewards_conversion_rate DECIMAL(10,4) DEFAULT 0.10;
ALTER TABLE business_settings ADD COLUMN IF NOT EXISTS points_per_booking INTEGER DEFAULT 50;
ALTER TABLE business_settings ADD COLUMN IF NOT EXISTS points_per_referral INTEGER DEFAULT 500;
ALTER TABLE business_settings ADD COLUMN IF NOT EXISTS points_profile_complete INTEGER DEFAULT 100;
ALTER TABLE business_settings ADD COLUMN IF NOT EXISTS min_redemption_points INTEGER DEFAULT 10;

-- Update existing records to have default values
UPDATE business_settings SET 
  rewards_enabled = true,
  rewards_conversion_rate = 0.10,
  points_per_booking = 50,
  points_per_referral = 500,
  points_profile_complete = 100,
  min_redemption_points = 10
WHERE rewards_enabled IS NULL;

-- Add comments for documentation
COMMENT ON COLUMN business_settings.rewards_enabled IS 'Enable/disable the rewards system platform-wide';
COMMENT ON COLUMN business_settings.rewards_conversion_rate IS 'Conversion rate from points to rupees (e.g., 0.10 = 10 points = ₹1)';
COMMENT ON COLUMN business_settings.points_per_booking IS 'Points awarded per completed booking';
COMMENT ON COLUMN business_settings.points_per_referral IS 'Points awarded per successful referral';
COMMENT ON COLUMN business_settings.points_profile_complete IS 'Points awarded for profile completion';
COMMENT ON COLUMN business_settings.min_redemption_points IS 'Minimum points required to redeem rewards';