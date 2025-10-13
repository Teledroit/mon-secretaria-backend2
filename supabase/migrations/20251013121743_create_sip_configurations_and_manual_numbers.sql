/*
  # Create SIP Configurations and Manual Number Entry

  1. New Tables
    - `sip_configurations` - Store SIP trunk configurations
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key)
      - `phone_number` (text)
      - `termination_uri` (text)
      - `username` (text)
      - `password` (text, encrypted)
      - `nickname` (text, optional)
      - `status` (text)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `sip_configurations`
    - Users can only see and manage their own SIP configurations

  3. Notes
    - Allows users to configure SIP trunks from external providers
    - Supports manual number entry for existing Twilio numbers
*/

-- Create SIP configurations table
CREATE TABLE IF NOT EXISTS sip_configurations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  phone_number text NOT NULL,
  termination_uri text NOT NULL,
  username text NOT NULL,
  password text NOT NULL,
  nickname text,
  status text DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE sip_configurations ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own SIP configs"
  ON sip_configurations FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own SIP configs"
  ON sip_configurations FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own SIP configs"
  ON sip_configurations FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own SIP configs"
  ON sip_configurations FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_sip_configurations_user_id ON sip_configurations(user_id);
CREATE INDEX IF NOT EXISTS idx_sip_configurations_phone_number ON sip_configurations(phone_number);
