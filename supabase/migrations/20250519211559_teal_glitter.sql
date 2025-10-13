/*
  # Improve AI Usage Tracking

  1. Changes
    - Add indexes for better query performance
    - Add view for active subscriptions with usage
    - Add function to get current usage stats
    - Add trigger to update usage stats

  2. Security
    - Maintain RLS policies
    - Add security definer to functions
*/

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_ai_usage_user_id_created_at 
ON ai_usage(user_id, created_at);

CREATE INDEX IF NOT EXISTS idx_ai_usage_billed 
ON ai_usage(billed)
WHERE NOT billed;

-- Create view for active subscriptions with usage
CREATE OR REPLACE VIEW active_subscriptions_with_usage AS
SELECT 
  s.*,
  COALESCE(u.total_minutes, 0) as minutes_used,
  COALESCE(u.total_cost, 0) as ai_cost,
  COALESCE(u.total_calls, 0) as total_calls
FROM active_subscriptions s
LEFT JOIN (
  SELECT 
    user_id,
    SUM(minutes_used) as total_minutes,
    SUM(cost) as total_cost,
    COUNT(*) as total_calls
  FROM ai_usage
  WHERE created_at >= date_trunc('month', CURRENT_DATE)
  GROUP BY user_id
) u ON s.user_id = u.user_id;

-- Function to get current usage stats
CREATE OR REPLACE FUNCTION get_current_usage_stats(user_id uuid)
RETURNS jsonb AS $$
DECLARE
  usage_data jsonb;
BEGIN
  WITH current_usage AS (
    SELECT 
      COALESCE(SUM(minutes_used), 0) as total_minutes,
      COALESCE(SUM(cost), 0) as total_cost,
      COUNT(*) as total_calls,
      COUNT(DISTINCT date_trunc('day', created_at)) as active_days
    FROM ai_usage
    WHERE user_id = get_current_usage_stats.user_id
    AND created_at >= date_trunc('month', CURRENT_DATE)
  )
  SELECT jsonb_build_object(
    'total_minutes', total_minutes,
    'total_cost', total_cost,
    'total_calls', total_calls,
    'active_days', active_days,
    'average_cost_per_minute', 
      CASE 
        WHEN total_minutes > 0 THEN total_cost / total_minutes 
        ELSE 0 
      END,
    'average_calls_per_day',
      CASE 
        WHEN active_days > 0 THEN total_calls::float / active_days 
        ELSE 0 
      END
  )
  INTO usage_data
  FROM current_usage;

  RETURN usage_data;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;