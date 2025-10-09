/*
  # Fix Document Deletion RLS Policies

  1. Changes
    - Drop existing policies safely using DO block
    - Create new policies with proper permissions
    - Add explicit user_id check for all operations
    - Fix policy definitions to handle soft deletes properly

  2. Security
    - Ensure users can only manage their own documents
    - Maintain data isolation between users
    - Handle soft deletes correctly
*/

-- Safely drop existing policies
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'instruction_documents'
  ) THEN
    DROP POLICY IF EXISTS "Users can view their own documents" ON instruction_documents;
    DROP POLICY IF EXISTS "Users can create their own documents" ON instruction_documents;
    DROP POLICY IF EXISTS "Users can update their own documents" ON instruction_documents;
    DROP POLICY IF EXISTS "Users can delete their own documents" ON instruction_documents;
    DROP POLICY IF EXISTS "Users can manage their own documents" ON instruction_documents;
    DROP POLICY IF EXISTS "Users can soft delete their own documents" ON instruction_documents;
  END IF;
END $$;

-- Enable RLS
ALTER TABLE instruction_documents ENABLE ROW LEVEL SECURITY;

-- Create new policies with proper permissions
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'instruction_documents' 
    AND policyname = 'Users can view their own documents'
  ) THEN
    CREATE POLICY "Users can view their own documents"
      ON instruction_documents
      FOR SELECT
      TO authenticated
      USING (
        user_id = auth.uid()
        AND deleted_at IS NULL
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'instruction_documents' 
    AND policyname = 'Users can create their own documents'
  ) THEN
    CREATE POLICY "Users can create their own documents"
      ON instruction_documents
      FOR INSERT
      TO authenticated
      WITH CHECK (user_id = auth.uid());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'instruction_documents' 
    AND policyname = 'Users can update their own documents'
  ) THEN
    CREATE POLICY "Users can update their own documents"
      ON instruction_documents
      FOR UPDATE
      TO authenticated
      USING (user_id = auth.uid());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'instruction_documents' 
    AND policyname = 'Users can soft delete their own documents'
  ) THEN
    CREATE POLICY "Users can soft delete their own documents"
      ON instruction_documents
      FOR UPDATE
      TO authenticated
      USING (
        user_id = auth.uid()
        AND deleted_at IS NULL
      )
      WITH CHECK (deleted_at IS NOT NULL);
  END IF;
END $$;