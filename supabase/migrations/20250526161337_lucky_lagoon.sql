/*
  # Fix Document Deletion RLS Policies

  1. Changes
    - Drop existing policies to avoid conflicts
    - Create simplified RLS policies that properly handle soft deletes
    - Ensure proper user authorization checks

  2. Security
    - Maintain data isolation between users
    - Allow users to manage their own documents
*/

-- Drop existing policies
DO $$ 
BEGIN
  DROP POLICY IF EXISTS "Users can view their own documents" ON instruction_documents;
  DROP POLICY IF EXISTS "Users can create their own documents" ON instruction_documents;
  DROP POLICY IF EXISTS "Users can update their own documents" ON instruction_documents;
END $$;

-- Enable RLS
ALTER TABLE instruction_documents ENABLE ROW LEVEL SECURITY;

-- Create simplified policies
CREATE POLICY "Users can view their own documents"
ON instruction_documents
FOR SELECT
TO authenticated
USING (
  user_id = auth.uid()
  AND deleted_at IS NULL
);

CREATE POLICY "Users can create their own documents"
ON instruction_documents
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can manage their own documents"
ON instruction_documents
FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());