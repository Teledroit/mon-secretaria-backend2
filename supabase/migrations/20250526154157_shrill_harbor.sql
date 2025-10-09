/*
  # Fix instruction documents RLS policies

  1. Changes
    - Update RLS policies for instruction_documents table to properly handle deletion
    - Add explicit DELETE policy for users to delete their own documents
    - Ensure soft delete works correctly with RLS

  2. Security
    - Enable RLS on instruction_documents table
    - Add policy for authenticated users to delete their own documents
    - Maintain existing policies for other operations
*/

-- Drop existing delete policy if it exists
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'instruction_documents' 
    AND policyname = 'Users can delete their own documents'
  ) THEN
    DROP POLICY "Users can delete their own documents" ON public.instruction_documents;
  END IF;
END $$;

-- Create new delete policy with proper conditions
CREATE POLICY "Users can delete their own documents"
ON public.instruction_documents
FOR DELETE
TO authenticated
USING (user_id = auth.uid());

-- Ensure RLS is enabled
ALTER TABLE public.instruction_documents ENABLE ROW LEVEL SECURITY;