/*
  # Add Document Instructions Support

  1. New Table
    - `instruction_documents`: Stores instruction documents and URLs
      - `id` (uuid, primary key)
      - `user_id` (uuid, references users)
      - `name` (text)
      - `type` (enum: pdf, url)
      - `content` (text)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
      - `deleted_at` (timestamptz)

  2. Security
    - Enable RLS
    - Add policies for users to manage their own documents
*/

-- Create document type enum
CREATE TYPE instruction_document_type AS ENUM ('pdf', 'url');

-- Create instruction_documents table
CREATE TABLE IF NOT EXISTS instruction_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) NOT NULL,
  name text NOT NULL,
  type instruction_document_type NOT NULL,
  content text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  deleted_at timestamptz
);

-- Enable RLS
ALTER TABLE instruction_documents ENABLE ROW LEVEL SECURITY;

-- Create policies
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

CREATE POLICY "Users can delete their own documents"
  ON instruction_documents
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Add index for better query performance
CREATE INDEX idx_instruction_documents_user_id 
ON instruction_documents(user_id)
WHERE deleted_at IS NULL;