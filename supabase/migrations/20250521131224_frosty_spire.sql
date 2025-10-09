/*
  # Add Twilio Accounts Support

  1. New Tables
    - `twilio_accounts`: Stores user Twilio subaccounts
      - `id` (uuid, primary key)
      - `user_id` (uuid, references users)
      - `account_sid` (text)
      - `auth_token` (text)
      - `status` (enum: active, suspended, closed)
      - Timestamps and soft delete

    - `twilio_phone_numbers`: Stores phone numbers for each account
      - `id` (uuid, primary key)
      - `account_id` (uuid, references twilio_accounts)
      - `phone_number` (text)
      - `friendly_name` (text)
      - `status` (enum: active, inactive)
      - Timestamps and soft delete

  2. Security
    - Enable RLS on both tables
    - Add policies for users to manage their own accounts and numbers
*/

-- Create status enums
CREATE TYPE twilio_account_status AS ENUM ('active', 'suspended', 'closed');
CREATE TYPE twilio_number_status AS ENUM ('active', 'inactive');

-- Create twilio_accounts table
CREATE TABLE IF NOT EXISTS twilio_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) NOT NULL,
  account_sid text NOT NULL,
  auth_token text NOT NULL,
  status twilio_account_status NOT NULL DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  deleted_at timestamptz
);

-- Create twilio_phone_numbers table
CREATE TABLE IF NOT EXISTS twilio_phone_numbers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid REFERENCES twilio_accounts(id) NOT NULL,
  phone_number text NOT NULL,
  friendly_name text,
  status twilio_number_status NOT NULL DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  deleted_at timestamptz
);

-- Enable RLS
ALTER TABLE twilio_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE twilio_phone_numbers ENABLE ROW LEVEL SECURITY;

-- Create policies for twilio_accounts
CREATE POLICY "Users can view their own Twilio accounts"
  ON twilio_accounts
  FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
    AND deleted_at IS NULL
  );

CREATE POLICY "Users can create their own Twilio accounts"
  ON twilio_accounts
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own Twilio accounts"
  ON twilio_accounts
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

-- Create policies for twilio_phone_numbers
CREATE POLICY "Users can view their own phone numbers"
  ON twilio_phone_numbers
  FOR SELECT
  TO authenticated
  USING (
    account_id IN (
      SELECT id FROM twilio_accounts 
      WHERE user_id = auth.uid() 
      AND deleted_at IS NULL
    )
    AND deleted_at IS NULL
  );

CREATE POLICY "Users can manage their own phone numbers"
  ON twilio_phone_numbers
  FOR ALL
  TO authenticated
  USING (
    account_id IN (
      SELECT id FROM twilio_accounts 
      WHERE user_id = auth.uid() 
      AND deleted_at IS NULL
    )
  );

-- Add indexes for better query performance
CREATE INDEX idx_twilio_accounts_user_id ON twilio_accounts(user_id) 
WHERE deleted_at IS NULL;

CREATE INDEX idx_twilio_phone_numbers_account_id ON twilio_phone_numbers(account_id) 
WHERE deleted_at IS NULL;

CREATE INDEX idx_twilio_phone_numbers_number ON twilio_phone_numbers(phone_number) 
WHERE deleted_at IS NULL;