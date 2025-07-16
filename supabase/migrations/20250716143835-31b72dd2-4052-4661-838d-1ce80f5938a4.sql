-- Add role-specific maintenance mode targeting
ALTER TABLE public.business_settings 
ADD COLUMN maintenance_target_roles text[] DEFAULT ARRAY['merchant', 'student', 'incharge', 'telemarketing_executive', 'pending_payments_caller', 'customer_care_executive', 'settlement_manager', 'general_administrator', 'institution'];