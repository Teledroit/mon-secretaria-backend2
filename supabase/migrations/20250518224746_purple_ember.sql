/*
  # Fix subscription status initialization

  1. Changes
    - Add trigger to properly initialize subscription status
    - Fix subscription status counting
    - Ensure new subscriptions start with correct call count
*/

-- Create function to initialize subscription with correct status
CREATE OR REPLACE FUNCTION initialize_subscription()
RETURNS trigger AS $$
BEGIN
  -- Only set initial status for new subscriptions
  IF NEW.subscription_id IS NULL THEN
    NEW.status = 'not_started';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for subscription initialization
DROP TRIGGER IF EXISTS on_subscription_created ON stripe_subscriptions;
CREATE TRIGGER on_subscription_created
  BEFORE INSERT ON stripe_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION initialize_subscription();

-- Create function to get current call count
CREATE OR REPLACE FUNCTION get_call_count(user_id uuid, start_date timestamptz)
RETURNS integer AS $$
DECLARE
  call_count integer;
BEGIN
  SELECT COUNT(*)
  INTO call_count
  FROM calls c
  WHERE c.user_id = get_call_count.user_id
  AND c.start_time >= start_date;
  
  RETURN COALESCE(call_count, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;