/*
  # Fix Configurations Table RLS Policies

  1. Changes
    - Drop existing policies safely
    - Enable RLS if not already enabled
    - Create new policies with proper permissions for authenticated users
    - Add policy for deleting own configurations

  2. Security
    - Ensure authenticated users can only access their own data
    - Prevent unauthorized access to configurations
*/

-- First, safely drop existing policies
DO $$ 
BEGIN
  -- Drop existing policies if they exist
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'configurations'
  ) THEN
    DROP POLICY IF EXISTS "Users can read own configurations" ON configurations;
    DROP POLICY IF EXISTS "Users can insert own configurations" ON configurations;
    DROP POLICY IF EXISTS "Users can update own configurations" ON configurations;
    DROP POLICY IF EXISTS "Users can delete own configurations" ON configurations;
  END IF;
END $$;

-- Enable RLS if not already enabled
ALTER TABLE configurations ENABLE ROW LEVEL SECURITY;

-- Create new policies with proper permissions
CREATE POLICY "Users can read own configurations"
  ON configurations
  FOR SELECT
  TO authenticated
  USING (auth.uid()::uuid = user_id);

CREATE POLICY "Users can insert own configurations"
  ON configurations
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid()::uuid = user_id);

CREATE POLICY "Users can update own configurations"
  ON configurations
  FOR UPDATE
  TO authenticated
  USING (auth.uid()::uuid = user_id);

CREATE POLICY "Users can delete own configurations"
  ON configurations
  FOR DELETE
  TO authenticated
  USING (auth.uid()::uuid = user_id);