/*
  # Phone Number Management System

  1. New Database Functions
    - Functions for managing Twilio phone numbers
    - SIP configuration management
    - Call routing and forwarding

  2. Features
    - Phone number purchase and management
    - SIP trunk configuration
    - Call routing rules
    - Number status tracking

  3. Security
    - User-specific number access
    - Secure credential storage
    - Access control policies
*/

-- Function to get user's phone numbers
CREATE OR REPLACE FUNCTION get_user_phone_numbers(user_uuid UUID)
RETURNS TABLE(
  id UUID,
  phone_number TEXT,
  friendly_name TEXT,
  status twilio_number_status,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    tpn.id,
    tpn.phone_number,
    tpn.friendly_name,
    tpn.status,
    tpn.created_at
  FROM twilio_phone_numbers tpn
  JOIN twilio_accounts ta ON tpn.account_id = ta.id
  WHERE ta.user_id = user_uuid
    AND tpn.deleted_at IS NULL
    AND ta.deleted_at IS NULL
  ORDER BY tpn.created_at DESC;
END;
$$;

-- Function to release a phone number
CREATE OR REPLACE FUNCTION release_phone_number(number_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_uuid UUID;
BEGIN
  -- Get the user_id for the phone number
  SELECT ta.user_id INTO user_uuid
  FROM twilio_phone_numbers tpn
  JOIN twilio_accounts ta ON tpn.account_id = ta.id
  WHERE tpn.id = number_id
    AND tpn.deleted_at IS NULL
    AND ta.deleted_at IS NULL;

  -- Check if user owns this number
  IF user_uuid != auth.uid() THEN
    RAISE EXCEPTION 'Access denied: You do not own this phone number';
  END IF;

  -- Mark as deleted (soft delete)
  UPDATE twilio_phone_numbers
  SET deleted_at = NOW(),
      status = 'inactive',
      updated_at = NOW()
  WHERE id = number_id;

  RETURN TRUE;
END;
$$;

-- Function to configure SIP trunk
CREATE OR REPLACE FUNCTION configure_sip_trunk(
  user_uuid UUID,
  phone_number TEXT,
  termination_uri TEXT,
  username TEXT,
  password TEXT,
  nickname TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  config_id UUID;
BEGIN
  -- Validate user
  IF user_uuid != auth.uid() THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  -- Insert or update SIP configuration
  INSERT INTO sip_configurations (
    user_id,
    phone_number,
    termination_uri,
    username,
    password,
    nickname,
    status
  ) VALUES (
    user_uuid,
    phone_number,
    termination_uri,
    username,
    password,
    nickname,
    'active'
  )
  ON CONFLICT (user_id, phone_number)
  DO UPDATE SET
    termination_uri = EXCLUDED.termination_uri,
    username = EXCLUDED.username,
    password = EXCLUDED.password,
    nickname = EXCLUDED.nickname,
    status = 'active',
    updated_at = NOW()
  RETURNING id INTO config_id;

  RETURN config_id;
END;
$$;

-- Function to get user's SIP configurations
CREATE OR REPLACE FUNCTION get_user_sip_configs(user_uuid UUID)
RETURNS TABLE(
  id UUID,
  phone_number TEXT,
  termination_uri TEXT,
  username TEXT,
  nickname TEXT,
  status sip_status,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    sc.id,
    sc.phone_number,
    sc.termination_uri,
    sc.username,
    sc.nickname,
    sc.status,
    sc.created_at
  FROM sip_configurations sc
  WHERE sc.user_id = user_uuid
    AND sc.deleted_at IS NULL
  ORDER BY sc.created_at DESC;
END;
$$;

-- Function to validate phone number format
CREATE OR REPLACE FUNCTION validate_phone_number(phone TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  -- Basic E.164 format validation
  RETURN phone ~ '^\+[1-9]\d{1,14}$';
END;
$$;

-- Function to get available phone numbers (mock data for demo)
CREATE OR REPLACE FUNCTION get_available_phone_numbers(
  area_code TEXT DEFAULT NULL,
  country_code TEXT DEFAULT 'FR'
)
RETURNS TABLE(
  phone_number TEXT,
  location TEXT,
  number_type TEXT,
  monthly_price NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Return mock data for demonstration
  -- In production, this would integrate with Twilio API
  RETURN QUERY
  SELECT 
    '+33' || (FLOOR(RANDOM() * 900000000) + 100000000)::TEXT as phone_number,
    CASE 
      WHEN area_code IS NOT NULL THEN area_code
      ELSE (ARRAY['Paris', 'Lyon', 'Marseille', 'Toulouse', 'Nice'])[FLOOR(RANDOM() * 5) + 1]
    END as location,
    'local' as number_type,
    1.00 as monthly_price
  FROM generate_series(1, 5);
END;
$$;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION get_user_phone_numbers(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION release_phone_number(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION configure_sip_trunk(UUID, TEXT, TEXT, TEXT, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_sip_configs(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION validate_phone_number(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_available_phone_numbers(TEXT, TEXT) TO authenticated;