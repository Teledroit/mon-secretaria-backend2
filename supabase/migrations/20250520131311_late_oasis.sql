/*
  # Add usage statistics function
  
  1. New Function
    - `get_current_usage_stats`: Returns aggregated usage statistics for the current billing period
      - Total minutes used
      - Total cost
      - Average cost per minute
      - Total number of calls
      - Number of active days
      - Average calls per day
  
  2. Security
    - Function is accessible only to authenticated users
    - Users can only see their own usage stats
*/

CREATE OR REPLACE FUNCTION public.get_current_usage_stats()
RETURNS TABLE (
  total_minutes numeric,
  total_cost numeric,
  average_cost_per_minute numeric,
  total_calls bigint,
  active_days bigint,
  average_calls_per_day numeric
) 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  v_user_id uuid;
  v_period_start timestamp with time zone;
  v_period_end timestamp with time zone;
BEGIN
  -- Get the authenticated user's ID
  v_user_id := auth.uid();
  
  -- Get the current billing period from stripe_subscriptions
  SELECT 
    to_timestamp(current_period_start) as period_start,
    to_timestamp(current_period_end) as period_end
  INTO v_period_start, v_period_end
  FROM stripe_subscriptions ss
  JOIN stripe_customers sc ON ss.customer_id = sc.customer_id
  WHERE sc.user_id = v_user_id
  AND ss.status IN ('trialing', 'active')
  AND ss.deleted_at IS NULL
  LIMIT 1;

  -- If no subscription found, use current month
  IF v_period_start IS NULL THEN
    v_period_start := date_trunc('month', now());
    v_period_end := date_trunc('month', now()) + interval '1 month';
  END IF;

  RETURN QUERY
  WITH usage_stats AS (
    SELECT
      COALESCE(SUM(minutes_used), 0) as total_minutes,
      COALESCE(SUM(cost), 0) as total_cost,
      COUNT(DISTINCT call_id) as total_calls,
      COUNT(DISTINCT DATE(created_at)) as active_days
    FROM ai_usage
    WHERE user_id = v_user_id
    AND created_at >= v_period_start
    AND created_at < v_period_end
  )
  SELECT
    total_minutes,
    total_cost,
    CASE 
      WHEN total_minutes > 0 THEN ROUND(total_cost / total_minutes, 2)
      ELSE 0
    END as average_cost_per_minute,
    total_calls,
    active_days,
    CASE 
      WHEN active_days > 0 THEN ROUND(total_calls::numeric / active_days, 1)
      ELSE 0
    END as average_calls_per_day
  FROM usage_stats;
END;
$$;