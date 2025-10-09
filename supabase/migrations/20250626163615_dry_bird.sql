/*
  # Move Auth Functions to Public Schema

  1. Changes
    - Move auth.is_google_authenticated to public schema
    - Move auth.get_google_user_info to public schema
    - Drop original functions from auth schema
    - Update function permissions

  2. Security
    - Maintain SECURITY DEFINER for proper access control
    - Grant execute permissions to authenticated users
*/

-- Move is_google_authenticated function to public schema
CREATE OR REPLACE FUNCTION public.is_google_authenticated()
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

-- Move get_google_user_info function to public schema
CREATE OR REPLACE FUNCTION public.get_google_user_info()
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

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION public.is_google_authenticated() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_google_user_info() TO authenticated;

-- Drop the original functions from auth schema
DROP FUNCTION IF EXISTS auth.is_google_authenticated();
DROP FUNCTION IF EXISTS auth.get_google_user_info();

-- Drop the index if it exists in auth schema (it will be recreated if needed)
DROP INDEX IF EXISTS auth.idx_users_google_provider;

-- Recreate the index in the proper location if needed
CREATE INDEX IF NOT EXISTS idx_users_google_provider 
ON auth.users ((raw_app_meta_data->>'provider'))
WHERE raw_app_meta_data->>'provider' = 'google';