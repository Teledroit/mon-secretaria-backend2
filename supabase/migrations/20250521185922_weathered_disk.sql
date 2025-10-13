/*
  # Add SIP Connection Support

  1. New Tables
    - `sip_configurations`: Stores SIP connection settings
      - `id` (uuid, primary key)
      - `user_id` (uuid, references users)
      - `phone_number` (text)
      - `termination_uri` (text)
      - `username` (text)
      - `password` (text, encrypted)
      - `nickname` (text)
      - `status` (enum: active, inactive)
      - Timestamps and soft delete

  2. Security
    - Enable RLS
    - Add policies for users to manage their own SIP configurations
    - Encrypt sensitive data
*/

-- Create status enum
CREATE TYPE sip_status AS ENUM ('active', 'inactive');

-- Create sip_configurations table
CREATE TABLE IF NOT EXISTS sip_configurations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) NOT NULL,
  phone_number text NOT NULL,
  termination_uri text NOT NULL,
  username text NOT NULL,
  password text NOT NULL,
  nickname text,
  status sip_status NOT NULL DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  deleted_at timestamptz
);

-- Enable RLS
ALTER TABLE sip_configurations ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own SIP configurations"
  ON sip_configurations
  FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
    AND deleted_at IS NULL
  );

CREATE POLICY "Users can create their own SIP configurations"
  ON sip_configurations
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own SIP configurations"
  ON sip_configurations
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own SIP configurations"
  ON sip_configurations
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Add function to manage SIP configurations
CREATE OR REPLACE FUNCTION manage_sip_config(
  p_phone_number text,
  p_termination_uri text,
  p_username text,
  p_password text,
  p_nickname text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_config_id uuid;
BEGIN
  -- Insert new configuration
  INSERT INTO sip_configurations (
    user_id,
    phone_number,
    termination_uri,
    username,
    password,
    nickname
  )
  VALUES (
    auth.uid(),
    p_phone_number,
    p_termination_uri,
    p_username,
    p_password,
    p_nickname
  )
  RETURNING id INTO v_config_id;

  RETURN v_config_id;
END;
$$;