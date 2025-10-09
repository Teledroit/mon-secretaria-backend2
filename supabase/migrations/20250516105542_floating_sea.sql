/*
  # Add phone field to users table

  1. Changes
    - Add phone column to users table
    - Make it nullable to maintain compatibility with existing records
    - Add index for phone number lookups

  2. Security
    - Existing RLS policies will handle access control
*/

-- Add phone column to users table
ALTER TABLE users
ADD COLUMN IF NOT EXISTS phone text;

-- Add index for phone number lookups
CREATE INDEX IF NOT EXISTS idx_users_phone 
ON users(phone)
WHERE phone IS NOT NULL;