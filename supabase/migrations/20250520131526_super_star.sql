/*
  # Fix get_current_usage_stats function

  1. Changes
    - Add user_id parameter to function signature
    - Use explicit table references to avoid ambiguity
    - Add proper type casting for numeric calculations
    - Improve error handling for edge cases

  2. Security
    - Add SECURITY DEFINER
    - Set search_path for security
*/

-- Drop the existing function if it exists
DROP FUNCTION IF EXISTS get_current_usage_stats(uuid);

-- Recreate the function with explicit parameter
CREATE OR REPLACE FUNCTION get_current_usage_stats(user_id uuid)
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
BEGIN
  RETURN QUERY
  WITH monthly_stats AS (
    SELECT
      COALESCE(SUM(au.minutes_used), 0) as total_minutes,
      COALESCE(SUM(au.cost), 0) as total_cost,
      COUNT(DISTINCT DATE(au.created_at)) as active_days,
      COUNT(DISTINCT au.call_id) as total_calls
    FROM ai_usage au
    WHERE 
      au.user_id = get_current_usage_stats.user_id
      AND au.created_at >= date_trunc('month', CURRENT_DATE)
      AND au.created_at < date_trunc('month', CURRENT_DATE) + interval '1 month'
  )
  SELECT
    ms.total_minutes,
    ms.total_cost,
    CASE 
      WHEN ms.total_minutes > 0 THEN ms.total_cost / ms.total_minutes 
      ELSE 0 
    END as average_cost_per_minute,
    ms.total_calls,
    ms.active_days,
    CASE 
      WHEN ms.active_days > 0 THEN ms.total_calls::numeric / ms.active_days::numeric
      ELSE 0 
    END as average_calls_per_day
  FROM monthly_stats ms;
END;
$$;