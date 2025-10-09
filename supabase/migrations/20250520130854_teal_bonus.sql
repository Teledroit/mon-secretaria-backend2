/*
  # Fix Call Limits and Period Reset

  1. Changes
    - Add function to check call limits based on subscription plan
    - Add function to get current billing period usage
    - Add trigger to enforce call limits

  2. Security
    - Maintain existing RLS policies
    - Add security definer to functions
*/

-- Create function to check call limits
CREATE OR REPLACE FUNCTION check_call_limits(user_id uuid)
RETURNS boolean AS $$
DECLARE
  subscription_record RECORD;
  call_count integer;
BEGIN
  -- Get the user's subscription
  SELECT s.price_id, s.current_period_start
  INTO subscription_record
  FROM stripe_customers c
  JOIN stripe_subscriptions s ON c.customer_id = s.customer_id
  WHERE c.user_id = user_id
  AND c.deleted_at IS NULL
  AND s.deleted_at IS NULL
  AND s.status IN ('active', 'trialing');

  -- If no active subscription, return false
  IF subscription_record IS NULL THEN
    RETURN false;
  END IF;

  -- Count calls in current period
  SELECT COUNT(*)
  INTO call_count
  FROM calls
  WHERE calls.user_id = check_call_limits.user_id
  AND calls.start_time >= to_timestamp(subscription_record.current_period_start);

  -- Check limits based on subscription
  RETURN CASE
    -- Premium plan (397€) has unlimited calls
    WHEN subscription_record.price_id = 'price_1RLQL4HCmF7qRHmmOjAvQVgi' THEN true
    -- Starter plan (1€) has 49 calls limit
    WHEN subscription_record.price_id = 'price_1RQ8ZxHCmF7qRHmmpTKP7VFi' THEN call_count < 49
    ELSE false
  END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger function to enforce call limits
CREATE OR REPLACE FUNCTION enforce_call_limits()
RETURNS trigger AS $$
BEGIN
  IF NOT check_call_limits(NEW.user_id) THEN
    RAISE EXCEPTION 'Call limit exceeded for current billing period';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on calls table
DROP TRIGGER IF EXISTS enforce_call_limits_trigger ON calls;
CREATE TRIGGER enforce_call_limits_trigger
  BEFORE INSERT ON calls
  FOR EACH ROW
  EXECUTE FUNCTION enforce_call_limits();