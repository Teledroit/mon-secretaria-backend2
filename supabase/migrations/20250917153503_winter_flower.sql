/*
  # Add document processing fields

  1. Table Updates
    - Add processing fields to `instruction_documents` table
    - `extracted_text` (text) - Extracted text content
    - `keywords` (text[]) - Array of keywords for search
    - `summary` (text) - AI-generated summary
    - `processed` (boolean) - Processing status

  2. Indexes
    - Add GIN index for keywords array search
    - Add index for processed status

  3. Functions
    - Add function to search documents by keywords
*/

-- Add new columns to instruction_documents table
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

-- Create indexes for better search performance
CREATE INDEX IF NOT EXISTS idx_instruction_documents_keywords 
  ON instruction_documents USING GIN (keywords);

CREATE INDEX IF NOT EXISTS idx_instruction_documents_processed 
  ON instruction_documents(processed) 
  WHERE processed = true;

-- Function to search documents by keywords
CREATE OR REPLACE FUNCTION search_documents_by_keywords(
  p_user_id uuid,
  p_search_terms text[]
)
RETURNS TABLE (
  id uuid,
  name text,
  type instruction_document_type,
  summary text,
  keywords text[],
  relevance_score integer
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    d.id,
    d.name,
    d.type,
    d.summary,
    d.keywords,
    (
      SELECT COUNT(*)::integer
      FROM unnest(d.keywords) AS keyword
      WHERE keyword = ANY(p_search_terms)
    ) AS relevance_score
  FROM instruction_documents d
  WHERE 
    d.user_id = p_user_id 
    AND d.deleted_at IS NULL 
    AND d.processed = true
    AND d.keywords && p_search_terms
  ORDER BY relevance_score DESC, d.created_at DESC;
END;
$$;