-- Remove the old monthly_pricing_view and merchant_pricing_plans table as they've been replaced by monthly_pricing_plans table
DROP VIEW IF EXISTS public.monthly_pricing_view;
DROP TABLE IF EXISTS public.merchant_pricing_plans;