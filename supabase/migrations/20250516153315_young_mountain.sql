/*
  # Fix RLS policies for users table

  1. Changes
    - Drop existing policies to avoid conflicts
    - Create new policy to allow authenticated users to insert their own data
    - Create policy to allow authenticated users to read their own data
    - Create policy to allow authenticated users to update their own data

  2. Security
    - Ensure users can only access their own data
    - Allow new users to create their initial profile
*/

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can insert own data" ON users;
DROP POLICY IF EXISTS "Users can read own data" ON users;
DROP POLICY IF EXISTS "Users can update own data" ON users;

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create new policies
CREATE POLICY "Users can insert own data"
  ON users
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can read own data"
  ON users
  FOR SELECT
  TO public
  USING (auth.uid() = id);

CREATE POLICY "Users can update own data"
  ON users
  FOR UPDATE
  TO public
  USING (auth.uid() = id);