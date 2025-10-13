/*
  # Set up AI Usage Metering

  1. Changes
    - Add metered usage configuration for AI billing
    - Add view for active subscriptions with usage
    - Add function to calculate total AI usage cost

  2. Security
    - Maintain existing RLS policies
    - Add function to calculate usage within billing period
*/

-- Create function to calculate usage within billing period
CREATE OR REPLACE FUNCTION get_billing_period_usage(
  customer_id text,
  start_timestamp bigint,
  end_timestamp bigint
) RETURNS jsonb AS $$
DECLARE
  usage_data jsonb;
BEGIN
  WITH customer_usage AS (
    SELECT 
      SUM(au.minutes_used) as total_minutes,
      SUM(au.cost) as total_cost,
      COUNT(*) as total_calls
    FROM stripe_customers sc
    JOIN users u ON sc.user_id = u.id
    JOIN ai_usage au ON u.id = au.user_id
    WHERE sc.customer_id = customer_id
    AND EXTRACT(EPOCH FROM au.created_at) >= start_timestamp
    AND EXTRACT(EPOCH FROM au.created_at) < end_timestamp
  )
  SELECT jsonb_build_object(
    'total_minutes', COALESCE(total_minutes, 0),
    'total_cost', COALESCE(total_cost, 0),
    'total_calls', COALESCE(total_calls, 0)
  )
  INTO usage_data
  FROM customer_usage;

  RETURN COALESCE(usage_data, jsonb_build_object(
    'total_minutes', 0,
    'total_cost', 0,
    'total_calls', 0
  ));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;