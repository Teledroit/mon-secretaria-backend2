/*
  # Fix Users Table RLS Policies

  1. Changes
    - Add policy to allow new users to insert their own data during registration
    - Ensure policy checks that the inserted user ID matches the authenticated user's ID

  2. Security
    - Maintains data integrity by only allowing users to insert their own records
    - Preserves existing read and update policies
*/

-- Add insert policy for users table
CREATE POLICY "Users can insert own data"
  ON users
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);