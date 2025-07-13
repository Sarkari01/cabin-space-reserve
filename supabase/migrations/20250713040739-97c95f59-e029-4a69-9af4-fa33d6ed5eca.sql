-- Create function to generate unique short IDs (5-6 digits)
CREATE OR REPLACE FUNCTION generate_short_id(table_name text, column_name text)
RETURNS integer
LANGUAGE plpgsql
AS $$
DECLARE
    new_id integer;
    max_attempts integer := 100;
    attempt_count integer := 0;
BEGIN
    LOOP
        -- Generate random 5-6 digit number (10000 to 999999)
        new_id := floor(random() * 990000 + 10000)::integer;
        
        -- Check if this ID already exists in the specified table
        EXECUTE format('SELECT 1 FROM %I WHERE %I = $1', table_name, column_name) 
        USING new_id;
        
        IF NOT FOUND THEN
            RETURN new_id;
        END IF;
        
        attempt_count := attempt_count + 1;
        IF attempt_count >= max_attempts THEN
            RAISE EXCEPTION 'Unable to generate unique short ID after % attempts', max_attempts;
        END IF;
    END LOOP;
END;
$$;

-- Add short ID columns to bookings table
ALTER TABLE public.bookings 
ADD COLUMN IF NOT EXISTS booking_number integer UNIQUE,
ADD COLUMN IF NOT EXISTS payment_status text DEFAULT 'unpaid';

-- Add short ID columns to transactions table
ALTER TABLE public.transactions 
ADD COLUMN IF NOT EXISTS transaction_number integer UNIQUE;

-- Add short ID columns to study_halls table
ALTER TABLE public.study_halls 
ADD COLUMN IF NOT EXISTS hall_number integer UNIQUE;

-- Add short ID columns to profiles table (merchant ID)
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS merchant_number integer UNIQUE;

-- Generate short IDs for existing records
UPDATE public.bookings 
SET booking_number = generate_short_id('bookings', 'booking_number')
WHERE booking_number IS NULL;

UPDATE public.transactions 
SET transaction_number = generate_short_id('transactions', 'transaction_number')
WHERE transaction_number IS NULL;

UPDATE public.study_halls 
SET hall_number = generate_short_id('study_halls', 'hall_number')
WHERE hall_number IS NULL;

UPDATE public.profiles 
SET merchant_number = generate_short_id('profiles', 'merchant_number')
WHERE merchant_number IS NULL AND role = 'merchant';

-- Create triggers to auto-generate short IDs for new records
CREATE OR REPLACE FUNCTION auto_generate_booking_number()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    IF NEW.booking_number IS NULL THEN
        NEW.booking_number := generate_short_id('bookings', 'booking_number');
    END IF;
    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION auto_generate_transaction_number()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    IF NEW.transaction_number IS NULL THEN
        NEW.transaction_number := generate_short_id('transactions', 'transaction_number');
    END IF;
    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION auto_generate_hall_number()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    IF NEW.hall_number IS NULL THEN
        NEW.hall_number := generate_short_id('study_halls', 'hall_number');
    END IF;
    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION auto_generate_merchant_number()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    IF NEW.merchant_number IS NULL AND NEW.role = 'merchant' THEN
        NEW.merchant_number := generate_short_id('profiles', 'merchant_number');
    END IF;
    RETURN NEW;
END;
$$;

-- Create triggers
DROP TRIGGER IF EXISTS trigger_auto_booking_number ON public.bookings;
CREATE TRIGGER trigger_auto_booking_number
    BEFORE INSERT ON public.bookings
    FOR EACH ROW
    EXECUTE FUNCTION auto_generate_booking_number();

DROP TRIGGER IF EXISTS trigger_auto_transaction_number ON public.transactions;
CREATE TRIGGER trigger_auto_transaction_number
    BEFORE INSERT ON public.transactions
    FOR EACH ROW
    EXECUTE FUNCTION auto_generate_transaction_number();

DROP TRIGGER IF EXISTS trigger_auto_hall_number ON public.study_halls;
CREATE TRIGGER trigger_auto_hall_number
    BEFORE INSERT ON public.study_halls
    FOR EACH ROW
    EXECUTE FUNCTION auto_generate_hall_number();

DROP TRIGGER IF EXISTS trigger_auto_merchant_number ON public.profiles;
CREATE TRIGGER trigger_auto_merchant_number
    BEFORE INSERT OR UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION auto_generate_merchant_number();