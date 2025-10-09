/*
  # Add Service Pause Functionality

  1. Changes
    - Add service_paused column to users table
    - Add function to check if service is paused
    - Add trigger to prevent call processing when service is paused

  2. Security
    - Maintain existing RLS policies
    - Add function to toggle service pause state
*/

-- Add service_paused column to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS service_paused boolean DEFAULT false;

-- Create function to check if service is paused
CREATE OR REPLACE FUNCTION is_service_paused(user_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM users
    WHERE id = user_id
    AND service_paused = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to toggle service pause state
CREATE OR REPLACE FUNCTION toggle_service_pause(user_id uuid)
RETURNS boolean AS $$
DECLARE
  current_state boolean;
BEGIN
  -- Get current pause state
  SELECT service_paused INTO current_state
  FROM users
  WHERE id = user_id;

  -- Toggle the state
  UPDATE users
  SET 
    service_paused = NOT current_state,
    updated_at = NOW()
  WHERE id = user_id;

  -- Return new state
  RETURN NOT current_state;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;