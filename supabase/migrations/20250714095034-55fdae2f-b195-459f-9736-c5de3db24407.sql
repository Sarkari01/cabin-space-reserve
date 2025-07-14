-- Fix RLS policy for merchant_subscriptions to allow merchants to create their own subscriptions
CREATE POLICY "Merchants can create their own subscription" 
ON public.merchant_subscriptions 
FOR INSERT 
WITH CHECK (merchant_id = auth.uid());