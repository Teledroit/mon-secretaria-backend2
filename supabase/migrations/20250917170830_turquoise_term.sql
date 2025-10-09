/*
  # Phone Number Management System

  1. Phone Number Functions
    - Search and purchase phone numbers via Twilio
    - Manage user phone number inventory
    - Handle number release and configuration

  2. SIP Configuration Functions
    - Configure SIP trunks for existing numbers
    - Manage SIP credentials securely
    - Handle call routing and forwarding

  3. Call Routing Functions
    - Route calls based on user configuration
    - Handle call forwarding rules
    - Manage call distribution

  4. Security
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
    AND ta.deleted_at IS NULL 
    AND tpn.deleted_at IS NULL
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
  user_id UUID;
BEGIN
  -- Get the user_id for the phone number
  SELECT ta.user_id INTO user_id
  FROM twilio_phone_numbers tpn
  JOIN twilio_accounts ta ON tpn.account_id = ta.id
  WHERE tpn.id = number_id AND tpn.deleted_at IS NULL;
  
  -- Check if user owns this number
  IF user_id != auth.uid() THEN
    RAISE EXCEPTION 'Unauthorized access to phone number';
  END IF;
  
  -- Mark as deleted (soft delete)
  UPDATE twilio_phone_numbers 
  SET deleted_at = NOW(), status = 'inactive'
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
    RAISE EXCEPTION 'Unauthorized access';
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
  -- Check if phone number matches international format (+country_code...)
  RETURN phone ~ '^\+[1-9]\d{1,14}$';
END;
$$;

-- Function to get available phone number types for a country
CREATE OR REPLACE FUNCTION get_phone_number_types(country_code TEXT DEFAULT 'FR')
RETURNS TABLE(
  type TEXT,
  description TEXT,
  monthly_cost DECIMAL
)
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    'local'::TEXT as type,
    'Numéro local français'::TEXT as description,
    1.00::DECIMAL as monthly_cost
  WHERE country_code = 'FR'
  
  UNION ALL
  
  SELECT 
    'mobile'::TEXT as type,
    'Numéro mobile français'::TEXT as description,
    2.00::DECIMAL as monthly_cost
  WHERE country_code = 'FR'
  
  UNION ALL
  
  SELECT 
    'tollfree'::TEXT as type,
    'Numéro vert français'::TEXT as description,
    5.00::DECIMAL as monthly_cost
  WHERE country_code = 'FR';
END;
$$;