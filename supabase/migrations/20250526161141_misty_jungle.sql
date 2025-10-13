/*
  # Fix instruction documents RLS policies

  1. Changes
    - Drop all existing policies to avoid conflicts
    - Create simplified policies that properly handle soft deletes
    - Add single unified update policy that handles both updates and soft deletes
    - Ensure proper access control for all operations

  2. Security
    - Maintain data isolation between users
    - Prevent unauthorized access
    - Handle soft deletes correctly
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

-- Enable RLS
ALTER TABLE instruction_documents ENABLE ROW LEVEL SECURITY;

-- Create policy for viewing documents (only non-deleted)
CREATE POLICY "Users can view their own documents"
ON instruction_documents
FOR SELECT
TO authenticated
USING (
  user_id = auth.uid()
  AND deleted_at IS NULL
);

-- Create policy for inserting documents
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
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());