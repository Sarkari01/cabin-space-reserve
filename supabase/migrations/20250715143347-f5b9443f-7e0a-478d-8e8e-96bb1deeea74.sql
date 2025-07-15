-- Fix the merchant subscription data to remove incorrect max_study_halls override
-- This will allow the Basic plan's limit of 5 study halls to be used instead of the override of 1

UPDATE merchant_subscriptions 
SET max_study_halls = NULL,
    updated_at = NOW()
WHERE merchant_id = (SELECT id FROM profiles WHERE role = 'merchant' LIMIT 1)
AND max_study_halls = 1;