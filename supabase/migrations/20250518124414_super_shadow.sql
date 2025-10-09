/*
  # Fix User Registration

  1. Changes
    - Drop existing function and trigger
    - Create improved function with better error handling
    - Add explicit type casting
    - Ensure proper metadata handling
    - Add logging for debugging

  2. Security
    - Maintain RLS policies
    - Keep security definer for proper permissions
*/

-- Drop existing function and trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user();

-- Create improved function with better error handling
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  -- Log the incoming data for debugging
  RAISE LOG 'Creating new user profile for id: %, email: %, metadata: %',
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data;

  -- Insert with explicit type casting and NULL handling
  INSERT INTO public.users (
    id,
    email,
    full_name,
    company_name,
    phone,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(
      (NEW.raw_user_meta_data->>'full_name')::text,
      NEW.email
    ),
    NULLIF((NEW.raw_user_meta_data->>'company_name')::text, ''),
    NULLIF((NEW.raw_user_meta_data->>'phone')::text, ''),
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE
  SET
    email = EXCLUDED.email,
    full_name = COALESCE(EXCLUDED.full_name, users.full_name),
    company_name = COALESCE(EXCLUDED.company_name, users.company_name),
    phone = COALESCE(EXCLUDED.phone, users.phone),
    updated_at = NOW();

  -- Log successful creation
  RAISE LOG 'Successfully created user profile for id: %', NEW.id;

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Log any errors that occur
  RAISE LOG 'Error creating user profile: %', SQLERRM;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger with explicit timing
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();