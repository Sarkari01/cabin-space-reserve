-- Create a function to help debug authentication context
CREATE OR REPLACE FUNCTION public.debug_auth_context()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  result jsonb := '{}';
  user_info record;
BEGIN
  -- Get auth context
  result := result || jsonb_build_object(
    'auth_uid', auth.uid(),
    'auth_role', auth.role(),
    'current_setting_role', current_setting('role', true),
    'session_user', session_user,
    'current_user', current_user
  );
  
  -- If we have a user ID, get profile info
  IF auth.uid() IS NOT NULL THEN
    SELECT id, email, role, created_at
    INTO user_info
    FROM public.profiles
    WHERE id = auth.uid();
    
    IF FOUND THEN
      result := result || jsonb_build_object('profile', row_to_json(user_info));
    ELSE
      result := result || jsonb_build_object('profile', 'not_found');
    END IF;
  END IF;
  
  RETURN result;
END;
$$;

-- Create a function specifically for merchants to create study halls with proper context
CREATE OR REPLACE FUNCTION public.create_study_hall_with_context(
  p_name text,
  p_description text,
  p_location text,
  p_total_seats integer,
  p_rows integer,
  p_seats_per_row integer,
  p_monthly_price numeric,
  p_amenities jsonb DEFAULT '[]'::jsonb,
  p_custom_row_names text[] DEFAULT ARRAY[]::text[],
  p_formatted_address text DEFAULT NULL,
  p_latitude numeric DEFAULT NULL,
  p_longitude numeric DEFAULT NULL,
  p_image_url text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  merchant_uuid uuid;
  new_study_hall record;
  auth_context jsonb;
BEGIN
  -- Get current auth context
  auth_context := public.debug_auth_context();
  
  -- Get the authenticated user ID
  merchant_uuid := auth.uid();
  
  -- Validate merchant is authenticated
  IF merchant_uuid IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'User not authenticated',
      'auth_context', auth_context
    );
  END IF;
  
  -- Validate user is a merchant
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = merchant_uuid AND role = 'merchant'
  ) THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'User is not a merchant',
      'auth_context', auth_context
    );
  END IF;
  
  -- Create the study hall
  INSERT INTO public.study_halls (
    merchant_id,
    name,
    description,
    location,
    total_seats,
    rows,
    seats_per_row,
    monthly_price,
    amenities,
    custom_row_names,
    formatted_address,
    latitude,
    longitude,
    image_url,
    status
  ) VALUES (
    merchant_uuid,
    p_name,
    p_description,
    p_location,
    p_total_seats,
    p_rows,
    p_seats_per_row,
    p_monthly_price,
    p_amenities,
    p_custom_row_names,
    p_formatted_address,
    p_latitude,
    p_longitude,
    p_image_url,
    'active'
  ) RETURNING * INTO new_study_hall;
  
  RETURN jsonb_build_object(
    'success', true,
    'data', row_to_json(new_study_hall),
    'auth_context', auth_context
  );
  
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'success', false,
    'error', SQLERRM,
    'sqlstate', SQLSTATE,
    'auth_context', auth_context
  );
END;
$$;