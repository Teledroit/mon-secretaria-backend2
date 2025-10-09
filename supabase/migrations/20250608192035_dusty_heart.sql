/*
  # Add specific instructions column to configurations table

  1. New Column
    - `specific_instructions` (text, nullable)
      - Stores the specific instructions for AI configuration
      - Allows users to save detailed context-specific instructions

  2. Changes
    - Add the new column to the existing configurations table
    - No data migration needed as this is a new optional field
*/

-- Add the specific_instructions column to store AI-specific instructions
ALTER TABLE public.configurations 
ADD COLUMN IF NOT EXISTS specific_instructions text;