/*
  # Fix instruction documents RLS policies

  1. Changes
    - Drop existing policies safely
    - Create new policies for CRUD operations
    - Handle soft deletes properly without NEW reference
    - Ensure RLS is enabled

  2. Security
    - Maintain data isolation between users
    - Allow soft deletes through UPDATE
*/

-- Drop all existing policies
DO $$ 
BEGIN
  DROP POLICY IF EXISTS "Users can view their own documents" ON instruction_documents;
  DROP POLICY IF EXISTS "Users can create their own documents" ON instruction_documents;
  DROP POLICY IF EXISTS "Users can update their own documents" ON instruction_documents;
  DROP POLICY IF EXISTS "Users can soft delete their own documents" ON instruction_documents;
  DROP POLICY IF EXISTS "Users can delete their own documents" ON instruction_documents;
END $$;

-- Create policy for viewing documents
CREATE POLICY "Users can view their own documents"
ON instruction_documents
FOR SELECT
TO authenticated
USING (
  user_id = auth.uid()
  AND deleted_at IS NULL
);

-- Create policy for creating documents
CREATE POLICY "Users can create their own documents"
ON instruction_documents
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- Create unified update policy that handles both updates and soft deletes
CREATE POLICY "Users can update their own documents"
ON instruction_documents
FOR UPDATE
TO authenticated
USING (user_id = auth.uid());

-- Ensure RLS is enabled
ALTER TABLE instruction_documents ENABLE ROW LEVEL SECURITY;