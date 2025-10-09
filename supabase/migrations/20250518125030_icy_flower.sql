/*
  # Improve user creation trigger

  1. Changes
    - Add better error handling
    - Ensure all user fields are properly handled
    - Add logging for debugging
    - Handle NULL values correctly
*/

-- Drop existing trigger and function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user();

-- Create improved function with better error handling
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
DECLARE
  profile_id uuid;
BEGIN
  -- Log the incoming data for debugging
  RAISE LOG 'Creating new user profile for id: %, email: %, metadata: %',
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data;

  -- First check if profile already exists
  SELECT id INTO profile_id FROM public.users WHERE id = NEW.id;
  
  IF profile_id IS NULL THEN
    -- Insert new profile if it doesn't exist
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
    );
    
    RAISE LOG 'Created new user profile for id: %', NEW.id;
  ELSE
    -- Update existing profile
    UPDATE public.users
    SET
      email = NEW.email,
      full_name = COALESCE(
        (NEW.raw_user_meta_data->>'full_name')::text,
        users.full_name
      ),
      company_name = COALESCE(
        NULLIF((NEW.raw_user_meta_data->>'company_name')::text, ''),
        users.company_name
      ),
      phone = COALESCE(
        NULLIF((NEW.raw_user_meta_data->>'phone')::text, ''),
        users.phone
      ),
      updated_at = NOW()
    WHERE id = NEW.id;
    
    RAISE LOG 'Updated existing user profile for id: %', NEW.id;
  END IF;

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Log any errors that occur
  RAISE LOG 'Error in handle_new_user: %', SQLERRM;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();