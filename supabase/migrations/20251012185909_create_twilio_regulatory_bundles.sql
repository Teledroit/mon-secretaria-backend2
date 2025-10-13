-- Create Twilio Regulatory Bundles Table
-- 
-- 1. New Tables
--   - twilio_regulatory_bundles
--     - id (uuid, primary key)
--     - user_id (uuid, foreign key to auth.users)
--     - bundle_sid (text, Twilio bundle SID)
--     - address_sid (text, reference to Twilio address)
--     - status (text, bundle status: draft, pending, approved, rejected)
--     - friendly_name (text, bundle name)
--     - regulation_sid (text, Twilio regulation SID for the country)
--     - created_at (timestamptz)
--     - updated_at (timestamptz)
--
-- 2. Security
--   - Enable RLS on twilio_regulatory_bundles table
--   - Add policies for CRUD operations

CREATE TABLE IF NOT EXISTS twilio_regulatory_bundles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  bundle_sid text UNIQUE NOT NULL,
  address_sid text NOT NULL,
  status text DEFAULT 'draft' NOT NULL,
  friendly_name text NOT NULL,
  regulation_sid text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE twilio_regulatory_bundles ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view own regulatory bundles"
  ON twilio_regulatory_bundles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own regulatory bundles"
  ON twilio_regulatory_bundles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own regulatory bundles"
  ON twilio_regulatory_bundles FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own regulatory bundles"
  ON twilio_regulatory_bundles FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_twilio_regulatory_bundles_user_id 
  ON twilio_regulatory_bundles(user_id);

CREATE INDEX IF NOT EXISTS idx_twilio_regulatory_bundles_bundle_sid 
  ON twilio_regulatory_bundles(bundle_sid);