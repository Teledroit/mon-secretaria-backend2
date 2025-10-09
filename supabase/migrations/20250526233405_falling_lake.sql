/*
  # Fix RLS Policies for Document Management

  1. Changes
    - Drop existing policies for instruction_documents
    - Create new policies with proper DELETE permissions
    - Add explicit user_id check for all operations
    - Fix policy definitions to handle soft deletes properly

  2. Security
    - Ensure users can only manage their own documents
    - Maintain data isolation between users
    - Handle soft deletes correctly
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own documents" ON instruction_documents;
DROP POLICY IF EXISTS "Users can create their own documents" ON instruction_documents;
DROP POLICY IF EXISTS "Users can update their own documents" ON instruction_documents;
DROP POLICY IF EXISTS "Users can delete their own documents" ON instruction_documents;
DROP POLICY IF EXISTS "Users can manage their own documents" ON instruction_documents;

-- Enable RLS
ALTER TABLE instruction_documents ENABLE ROW LEVEL SECURITY;

-- Create new policies with proper permissions
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

CREATE POLICY "Users can update their own documents"
  ON instruction_documents
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can soft delete their own documents"
  ON instruction_documents
  FOR UPDATE
  TO authenticated
  USING (
    user_id = auth.uid()
    AND deleted_at IS NULL
  )
  WITH CHECK (deleted_at IS NOT NULL);