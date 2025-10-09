/*
  # Add document processing fields to instruction_documents

  1. New Columns
    - `extracted_text` (text, extracted content from PDFs/URLs)
    - `keywords` (text[], searchable keywords)
    - `summary` (text, AI-generated summary)
    - `processed` (boolean, processing status)

  2. Indexes
    - GIN index on keywords for fast search
    - Index on processed status
    - Index on user_id for user-specific queries

  3. Security
    - Existing RLS policies apply
*/

-- Add new columns if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'instruction_documents' AND column_name = 'extracted_text'
  ) THEN
    ALTER TABLE instruction_documents ADD COLUMN extracted_text text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'instruction_documents' AND column_name = 'keywords'
  ) THEN
    ALTER TABLE instruction_documents ADD COLUMN keywords text[];
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'instruction_documents' AND column_name = 'summary'
  ) THEN
    ALTER TABLE instruction_documents ADD COLUMN summary text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'instruction_documents' AND column_name = 'processed'
  ) THEN
    ALTER TABLE instruction_documents ADD COLUMN processed boolean DEFAULT false;
  END IF;
END $$;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_instruction_documents_keywords ON instruction_documents USING gin(keywords);
CREATE INDEX IF NOT EXISTS idx_instruction_documents_processed ON instruction_documents(processed) WHERE processed = true;
CREATE INDEX IF NOT EXISTS idx_instruction_documents_user_id ON instruction_documents(user_id) WHERE deleted_at IS NULL;