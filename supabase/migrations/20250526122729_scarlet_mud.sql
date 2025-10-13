/*
  # Fix Document Deletion RLS Policy

  1. Changes
    - Drop existing update policy
    - Create new policy that properly handles soft deletes
    - Use proper syntax for RLS policy conditions

  2. Security
    - Maintain data isolation between users
    - Allow users to soft delete their own documents
    - Prevent modifications to already deleted documents
*/

-- Drop existing update policy if it exists
DROP POLICY IF EXISTS "Users can update their own documents" ON instruction_documents;

-- Create new update policy that properly handles soft deletes
CREATE POLICY "Users can update their own documents"
ON instruction_documents
FOR UPDATE
TO authenticated
USING (
  user_id = auth.uid() 
  AND (
    -- Only allow updates on non-deleted documents
    deleted_at IS NULL
  )
);

-- Create separate policy for soft deletes
CREATE POLICY "Users can soft delete their own documents"
ON instruction_documents
FOR UPDATE
TO authenticated
USING (
  user_id = auth.uid() 
  AND deleted_at IS NULL
)
WITH CHECK (
  user_id = auth.uid()
);