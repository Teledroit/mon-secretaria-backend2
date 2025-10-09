/*
  # Fix RLS policies for configurations table

  1. Security
    - Ensures RLS is enabled on configurations table
    - Adds policies for authenticated users to:
      - Read their own configurations
      - Insert their own configurations
      - Update their own configurations
    - Includes safety checks to prevent duplicate policy errors
*/

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

-- Drop existing policies if they exist
DO $$ 
BEGIN
  DROP POLICY IF EXISTS "Users can read own configurations" ON configurations;
  DROP POLICY IF EXISTS "Users can insert own configurations" ON configurations;
  DROP POLICY IF EXISTS "Users can update own configurations" ON configurations;
END $$;

-- Create policies
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
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);