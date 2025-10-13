/*
  # Fix get_current_usage_stats function

  1. Changes
    - Drop existing functions to avoid conflicts
    - Create new function with proper parameter handling
    - Fix ambiguous column references by using table aliases
    - Maintain existing functionality with better error handling

  2. Security
    - Keep security definer setting
    - Set explicit search path
*/

-- Drop existing functions to avoid conflicts
DROP FUNCTION IF EXISTS get_current_usage_stats();
DROP FUNCTION IF EXISTS get_current_usage_stats(uuid);

-- Create new function with proper parameter handling
CREATE OR REPLACE FUNCTION get_current_usage_stats()
RETURNS TABLE (
  total_minutes numeric,
  total_cost numeric,
  average_cost_per_minute numeric,
  total_calls bigint,
  active_days bigint,
  average_calls_per_day numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_period_start timestamptz;
  v_period_end timestamptz;
BEGIN
  -- Get authenticated user ID
  v_user_id := auth.uid();
  
  -- Get current billing period
  SELECT 
    to_timestamp(ss.current_period_start),
    to_timestamp(ss.current_period_end)
  INTO v_period_start, v_period_end
  FROM stripe_subscriptions ss
  JOIN stripe_customers sc ON ss.customer_id = sc.customer_id
  WHERE sc.user_id = v_user_id
  AND ss.status IN ('trialing', 'active')
  AND ss.deleted_at IS NULL
  LIMIT 1;

  -- Default to current month if no subscription found
  IF v_period_start IS NULL THEN
    v_period_start := date_trunc('month', CURRENT_DATE);
    v_period_end := v_period_start + interval '1 month';
  END IF;

  RETURN QUERY
  WITH usage_data AS (
    SELECT
      COALESCE(SUM(au.minutes_used), 0) as period_minutes,
      COALESCE(SUM(au.cost), 0) as period_cost,
      COUNT(DISTINCT au.call_id) as period_calls,
      COUNT(DISTINCT DATE(au.created_at)) as period_days
    FROM ai_usage au
    WHERE au.user_id = v_user_id
    AND au.created_at >= v_period_start
    AND au.created_at < v_period_end
  )
  SELECT
    ud.period_minutes,
    ud.period_cost,
    CASE 
      WHEN ud.period_minutes > 0 THEN ROUND(ud.period_cost / ud.period_minutes, 2)
      ELSE 0 
    END,
    ud.period_calls,
    ud.period_days,
    CASE 
      WHEN ud.period_days > 0 THEN ROUND(ud.period_calls::numeric / ud.period_days, 1)
      ELSE 0 
    END
  FROM usage_data ud;
END;
$$;