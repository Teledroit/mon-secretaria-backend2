/*
  # Fix RLS policy for instruction_documents deletion

  1. Security Changes
    - Drop existing UPDATE policy that prevents soft deletion
    - Create new UPDATE policy that allows users to update their own documents including deleted_at field
    - Add DELETE policy for hard deletion if needed

  2. Changes Made
    - Fixed RLS policies to use correct auth.uid() function
    - Allow soft deletion by setting deleted_at timestamp
    - Maintain user ownership security
*/

-- Drop the existing UPDATE policy
DROP POLICY IF EXISTS "Users can update their own documents" ON instruction_documents;

-- Create a new UPDATE policy that allows soft deletion
CREATE POLICY "Users can update their own documents"
  ON instruction_documents
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Ensure the DELETE policy exists for hard deletion if needed
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'instruction_documents' 
    AND policyname = 'Users can delete their own documents'
  ) THEN
    CREATE POLICY "Users can delete their own documents"
      ON instruction_documents
      FOR DELETE
      TO authenticated
      USING (user_id = auth.uid());
  END IF;
END $$;