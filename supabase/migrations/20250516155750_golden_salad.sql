/*
  # Fix RLS policies for user creation

  1. Changes
    - Drop existing policies to avoid conflicts
    - Create new policy to allow user creation during signup
    - Ensure proper RLS enforcement for user data

  2. Security
    - Allow authenticated users to insert their own data
    - Maintain data isolation between users
    - Prevent unauthorized access
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON users;
DROP POLICY IF EXISTS "Enable read access for users based on user_id" ON users;
DROP POLICY IF EXISTS "Enable update for users based on user_id" ON users;

-- Create new policies with proper permissions
CREATE POLICY "Enable insert for authenticated users only"
ON users
FOR INSERT
WITH CHECK (
  -- Allow insert if the user is authenticated and inserting their own record
  auth.uid() = id
);

CREATE POLICY "Enable read access for users based on user_id"
ON users
FOR SELECT
USING (
  -- Users can only read their own data
  auth.uid() = id
);

CREATE POLICY "Enable update for users based on user_id"
ON users
FOR UPDATE
USING (
  -- Users can only update their own data
  auth.uid() = id
);