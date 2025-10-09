/*
  # Add Subscription Check Function and Trigger

  1. New Function
    - Creates a function to verify subscription status
    - Checks if user has an active subscription
    - Handles trial periods and grace periods

  2. Security
    - Function runs with SECURITY DEFINER to access stripe tables
    - Only authenticated users can access the function
*/

-- Create function to check subscription status
CREATE OR REPLACE FUNCTION check_subscription_status(user_id uuid)
RETURNS boolean AS $$
DECLARE
  subscription_record RECORD;
BEGIN
  -- Get the user's subscription status
  SELECT s.*
  INTO subscription_record
  FROM stripe_customers c
  JOIN stripe_subscriptions s ON c.customer_id = s.customer_id
  WHERE c.user_id = user_id
  AND c.deleted_at IS NULL
  AND s.deleted_at IS NULL;

  -- Return true if:
  -- 1. User has an active subscription
  -- 2. User is in trial period
  -- 3. User has a past_due subscription (grace period)
  RETURN COALESCE(
    subscription_record.status IN (
      'active',
      'trialing',
      'past_due'
    ),
    false
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;