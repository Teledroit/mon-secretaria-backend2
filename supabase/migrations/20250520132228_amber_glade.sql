/*
  # Add toggle_service_pause function

  1. New Function
    - `toggle_service_pause()`
      - Toggles the service_paused boolean for the current user
      - Returns boolean indicating new pause state
      - Security definer function to ensure it runs with elevated privileges
      - Can only be executed by authenticated users

  2. Security
    - Function is marked as SECURITY DEFINER to run with owner privileges
    - Access restricted to authenticated users only via GRANT
*/

-- Create the function to toggle service pause state
CREATE OR REPLACE FUNCTION public.toggle_service_pause()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_state boolean;
BEGIN
  -- Update the service_paused status and return the new state
  UPDATE public.users 
  SET service_paused = NOT service_paused,
      updated_at = now()
  WHERE id = auth.uid()
  RETURNING service_paused INTO new_state;
  
  RETURN new_state;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.toggle_service_pause() TO authenticated;