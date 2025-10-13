/*
  # Fix subscription view and status function

  1. Changes
    - Rename subscription_status to status to match table column name
    - Add view for active subscriptions
    - Add function to get subscription status
    - Include proper security settings
*/

-- Create view for active subscriptions
CREATE OR REPLACE VIEW active_subscriptions AS
SELECT 
  c.user_id,
  s.subscription_id,
  s.status,
  s.price_id,
  s.current_period_start,
  s.current_period_end,
  s.cancel_at_period_end,
  s.payment_method_brand,
  s.payment_method_last4
FROM stripe_customers c
JOIN stripe_subscriptions s ON c.customer_id = s.customer_id
WHERE c.deleted_at IS NULL 
AND s.deleted_at IS NULL
AND s.status IN ('active', 'trialing', 'past_due', 'not_started');

-- Create function to get subscription status
CREATE OR REPLACE FUNCTION get_subscription_status(user_id uuid)
RETURNS jsonb AS $$
DECLARE
  subscription_data jsonb;
BEGIN
  SELECT jsonb_build_object(
    'subscription_id', subscription_id,
    'status', status,
    'price_id', price_id,
    'current_period_start', current_period_start,
    'current_period_end', current_period_end,
    'cancel_at_period_end', cancel_at_period_end
  )
  INTO subscription_data
  FROM active_subscriptions
  WHERE user_id = $1;

  RETURN COALESCE(subscription_data, jsonb_build_object(
    'status', 'not_found',
    'message', 'No active subscription found'
  ));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;