/*
  # Fix RLS policies for configurations table

  1. Security Changes
    - Drop existing policies to avoid conflicts
    - Create new policies with proper permissions for authenticated users
    - Ensure RLS is enabled
*/

-- Drop existing policies if they exist
DO $$ 
BEGIN
  DROP POLICY IF EXISTS "Users can read own configurations" ON configurations;
  DROP POLICY IF EXISTS "Users can insert own configurations" ON configurations;
  DROP POLICY IF EXISTS "Users can update own configurations" ON configurations;
END $$;

-- Enable RLS if not already enabled
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename = 'configurations' 
    AND rowsecurity = true
  ) THEN
    ALTER TABLE configurations ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- Create policies with proper permissions
CREATE POLICY "Users can read own configurations"
  ON configurations
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own configurations"
  ON configurations
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own configurations"
  ON configurations
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);