-- Add new operational roles to the user_role enum
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'telemarketing_executive';
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'pending_payments_caller';
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'customer_care_executive';
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'settlement_manager';
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'general_administrator';