/*
  # Add client email field to appointments table

  1. New Columns
    - `client_email` (text, optional email for appointment clients)

  2. Changes
    - Add email field to store client contact information
    - Update existing appointments to have null email initially
*/

-- Add client_email column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'appointments' AND column_name = 'client_email'
  ) THEN
    ALTER TABLE appointments ADD COLUMN client_email text;
  END IF;
END $$;