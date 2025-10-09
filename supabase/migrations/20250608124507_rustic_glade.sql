/*
  # Fix document deletion RLS policy

  1. Security Changes
    - Drop the conflicting soft delete policy
    - Update the general update policy to allow soft deletion
    - Ensure users can update their own documents including setting deleted_at

  This migration fixes the RLS policy violation when users try to delete their own documents.
*/

-- Drop the conflicting soft delete policy
DROP POLICY IF EXISTS "Users can soft delete their own documents" ON instruction_documents;

-- Update the general update policy to be more permissive for soft deletion
DROP POLICY IF EXISTS "Users can update their own documents" ON instruction_documents;

-- Create a new comprehensive update policy that allows both regular updates and soft deletion
CREATE POLICY "Users can update their own documents"
  ON instruction_documents
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());