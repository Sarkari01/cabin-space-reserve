-- Fix subscription_transactions table to allow null subscription_id during transaction creation
ALTER TABLE public.subscription_transactions 
ALTER COLUMN subscription_id DROP NOT NULL;

-- Add a comment to clarify the purpose
COMMENT ON COLUMN public.subscription_transactions.subscription_id IS 'Subscription ID - null during transaction creation, updated after subscription is created';