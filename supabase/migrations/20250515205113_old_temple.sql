/*
  # Enable Google Authentication

  1. Changes
    - Creates necessary configuration for Google OAuth
    - Sets up required authentication settings
    - Adds security policies
*/

-- Create a function to check if a user is authenticated with Google
CREATE OR REPLACE FUNCTION auth.is_google_authenticated()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM auth.users
    WHERE id = auth.uid()
    AND raw_app_meta_data->>'provider' = 'google'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to get Google user info
CREATE OR REPLACE FUNCTION auth.get_google_user_info()
RETURNS jsonb AS $$
BEGIN
  RETURN (
    SELECT raw_user_meta_data
    FROM auth.users
    WHERE id = auth.uid()
    AND raw_app_meta_data->>'provider' = 'google'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add index for provider lookup
CREATE INDEX IF NOT EXISTS idx_users_google_provider 
ON auth.users ((raw_app_meta_data->>'provider'))
WHERE raw_app_meta_data->>'provider' = 'google';