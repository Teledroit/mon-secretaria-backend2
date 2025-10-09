/*
  # Fix RLS policy for instruction documents deletion

  1. Security Changes
    - Update the existing UPDATE policy to allow soft deletion
    - Ensure users can update their own documents including setting deleted_at
    
  2. Changes Made
    - Drop the existing restrictive UPDATE policy
    - Create a new UPDATE policy that allows users to update their own documents
    - Maintain security by ensuring users can only update documents they own
*/

-- Drop the existing UPDATE policy that's too restrictive
DROP POLICY IF EXISTS "Users can update their own documents" ON instruction_documents;

-- Create a new UPDATE policy that allows soft deletion
CREATE POLICY "Users can update their own documents"
  ON instruction_documents
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());