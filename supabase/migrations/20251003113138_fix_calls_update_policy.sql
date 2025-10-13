/*
  # Fix Missing UPDATE Policy on Calls Table

  1. Changes
    - Add UPDATE policy for calls table to allow users to update their own calls
    - This is critical for updating call status, duration, cost, and other metadata

  2. Security
    - Users can only update their own calls (auth.uid() = user_id)
    - Policy ensures data isolation between users
*/

-- Drop policy if it exists and recreate
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'calls' 
      AND policyname = 'Users can update own calls'
  ) THEN
    DROP POLICY "Users can update own calls" ON calls;
  END IF;
END $$;

-- Add UPDATE policy for calls table
CREATE POLICY "Users can update own calls"
  ON calls
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
