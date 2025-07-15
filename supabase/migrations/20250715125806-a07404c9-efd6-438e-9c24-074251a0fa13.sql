-- Safe date handling improvements and data validation
-- This migration addresses potential null date issues and adds better validation

-- Update any null or invalid dates in withdrawal_requests
UPDATE withdrawal_requests 
SET created_at = COALESCE(created_at, NOW()),
    updated_at = COALESCE(updated_at, NOW())
WHERE created_at IS NULL OR updated_at IS NULL;

-- Update any null or invalid dates in settlements
UPDATE settlements 
SET created_at = COALESCE(created_at, NOW()),
    updated_at = COALESCE(updated_at, NOW())
WHERE created_at IS NULL OR updated_at IS NULL;

-- Update any null or invalid dates in transactions
UPDATE transactions 
SET created_at = COALESCE(created_at, NOW()),
    updated_at = COALESCE(updated_at, NOW())
WHERE created_at IS NULL OR updated_at IS NULL;

-- Update any null or invalid dates in bookings
UPDATE bookings 
SET created_at = COALESCE(created_at, NOW()),
    updated_at = COALESCE(updated_at, NOW())
WHERE created_at IS NULL OR updated_at IS NULL;

-- Update any null or invalid dates in subscription_transactions
UPDATE subscription_transactions 
SET created_at = COALESCE(created_at, NOW()),
    updated_at = COALESCE(updated_at, NOW())
WHERE created_at IS NULL OR updated_at IS NULL;

-- Update any null or invalid dates in merchant_subscriptions
UPDATE merchant_subscriptions 
SET created_at = COALESCE(created_at, NOW()),
    updated_at = COALESCE(updated_at, NOW()),
    start_date = COALESCE(start_date, NOW())
WHERE created_at IS NULL OR updated_at IS NULL OR start_date IS NULL;

-- Add NOT NULL constraints where appropriate (after data cleanup)
-- These will prevent future null date issues

-- For withdrawal_requests
ALTER TABLE withdrawal_requests 
  ALTER COLUMN created_at SET NOT NULL,
  ALTER COLUMN updated_at SET NOT NULL;

-- For settlements
ALTER TABLE settlements 
  ALTER COLUMN created_at SET NOT NULL,
  ALTER COLUMN updated_at SET NOT NULL;

-- For transactions
ALTER TABLE transactions 
  ALTER COLUMN created_at SET NOT NULL,
  ALTER COLUMN updated_at SET NOT NULL;

-- For bookings
ALTER TABLE bookings 
  ALTER COLUMN created_at SET NOT NULL,
  ALTER COLUMN updated_at SET NOT NULL;

-- For subscription_transactions
ALTER TABLE subscription_transactions 
  ALTER COLUMN created_at SET NOT NULL,
  ALTER COLUMN updated_at SET NOT NULL;

-- For merchant_subscriptions
ALTER TABLE merchant_subscriptions 
  ALTER COLUMN created_at SET NOT NULL,
  ALTER COLUMN updated_at SET NOT NULL,
  ALTER COLUMN start_date SET NOT NULL;

-- Create a function to validate date strings before processing
CREATE OR REPLACE FUNCTION validate_date_string(date_string text)
RETURNS boolean
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
    -- Try to parse the date string
    PERFORM date_string::timestamp;
    RETURN true;
EXCEPTION
    WHEN OTHERS THEN
        RETURN false;
END;
$$;

-- Add a comment explaining the safe date handling
COMMENT ON FUNCTION validate_date_string(text) IS 'Validates if a text string can be safely converted to a timestamp';

-- Log the completion
DO $$
BEGIN
    RAISE NOTICE 'Date validation and cleanup migration completed successfully';
END $$;