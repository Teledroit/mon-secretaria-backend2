/*
  # Create Twilio Addresses Table

  1. New Tables
    - `twilio_addresses`
      - `id` (uuid, primary key) - Unique identifier for the address record
      - `user_id` (uuid, foreign key) - Reference to the user who owns this address
      - `address_sid` (text, unique) - Twilio's Address SID returned from their API
      - `customer_name` (text) - Full name for the address
      - `street` (text) - Street address
      - `city` (text) - City name
      - `region` (text) - State/Region/Province
      - `postal_code` (text) - ZIP/Postal code
      - `country` (text) - ISO country code (e.g., FR, US)
      - `is_default` (boolean) - Whether this is the user's default address
      - `created_at` (timestamptz) - When the address was created
      - `updated_at` (timestamptz) - When the address was last updated

  2. Security
    - Enable RLS on `twilio_addresses` table
    - Add policy for authenticated users to read their own addresses
    - Add policy for authenticated users to insert their own addresses
    - Add policy for authenticated users to update their own addresses
    - Add policy for authenticated users to delete their own addresses

  3. Indexes
    - Add index on user_id for faster queries
    - Add index on address_sid for Twilio API lookups
    - Add index on is_default for quick default address retrieval

  4. Important Notes
    - All address fields follow Twilio's Address API requirements
    - The address_sid is unique and required for purchasing phone numbers
    - Users can have multiple addresses but only one default
    - When a new default address is set, the previous default should be unset
*/

-- Create twilio_addresses table
CREATE TABLE IF NOT EXISTS twilio_addresses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  address_sid text UNIQUE NOT NULL,
  customer_name text NOT NULL,
  street text NOT NULL,
  city text NOT NULL,
  region text NOT NULL,
  postal_code text NOT NULL,
  country text NOT NULL DEFAULT 'FR',
  is_default boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_twilio_addresses_user_id ON twilio_addresses(user_id);
CREATE INDEX IF NOT EXISTS idx_twilio_addresses_address_sid ON twilio_addresses(address_sid);
CREATE INDEX IF NOT EXISTS idx_twilio_addresses_is_default ON twilio_addresses(user_id, is_default) WHERE is_default = true;

-- Enable RLS
ALTER TABLE twilio_addresses ENABLE ROW LEVEL SECURITY;

-- Create policies for authenticated users
CREATE POLICY "Users can view own addresses"
  ON twilio_addresses FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own addresses"
  ON twilio_addresses FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own addresses"
  ON twilio_addresses FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own addresses"
  ON twilio_addresses FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create function to ensure only one default address per user
CREATE OR REPLACE FUNCTION ensure_single_default_address()
RETURNS TRIGGER AS $$
BEGIN
  -- If the new/updated address is set as default
  IF NEW.is_default = true THEN
    -- Unset all other addresses for this user as default
    UPDATE twilio_addresses
    SET is_default = false
    WHERE user_id = NEW.user_id
      AND id != NEW.id
      AND is_default = true;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to enforce single default address
DROP TRIGGER IF EXISTS trigger_ensure_single_default_address ON twilio_addresses;
CREATE TRIGGER trigger_ensure_single_default_address
  BEFORE INSERT OR UPDATE ON twilio_addresses
  FOR EACH ROW
  EXECUTE FUNCTION ensure_single_default_address();

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_twilio_addresses_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-update updated_at
DROP TRIGGER IF EXISTS trigger_update_twilio_addresses_updated_at ON twilio_addresses;
CREATE TRIGGER trigger_update_twilio_addresses_updated_at
  BEFORE UPDATE ON twilio_addresses
  FOR EACH ROW
  EXECUTE FUNCTION update_twilio_addresses_updated_at();
