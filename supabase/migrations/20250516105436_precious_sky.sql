/*
  # Add phone field to users table

  1. Changes
    - Add phone field to users table
    - Make it nullable to maintain compatibility with existing records
*/

-- Add phone field to users table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' 
    AND column_name = 'phone'
  ) THEN
    ALTER TABLE users ADD COLUMN phone text;
  END IF;
END $$;