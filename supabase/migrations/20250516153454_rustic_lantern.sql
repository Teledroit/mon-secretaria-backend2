/*
  # Fix users table RLS policies

  1. Changes
    - Update RLS policies for users table to allow proper user registration
    - Add policy for inserting new users during registration
    - Ensure authenticated users can only access their own data

  2. Security
    - Enable RLS on users table
    - Add policies for:
      - INSERT: Allow during registration when id matches auth.uid()
      - SELECT: Users can read their own data
      - UPDATE: Users can update their own data
*/

-- Drop existing policies to recreate them with correct permissions
DROP POLICY IF EXISTS "Users can insert own data" ON users;
DROP POLICY IF EXISTS "Users can read own data" ON users;
DROP POLICY IF EXISTS "Users can update own data" ON users;

-- Recreate policies with correct permissions
CREATE POLICY "Enable insert for authenticated users only"
ON public.users
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

CREATE POLICY "Enable read access for users based on user_id"
ON public.users
FOR SELECT
TO public
USING (auth.uid() = id);

CREATE POLICY "Enable update for users based on user_id"
ON public.users
FOR UPDATE
TO public
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);