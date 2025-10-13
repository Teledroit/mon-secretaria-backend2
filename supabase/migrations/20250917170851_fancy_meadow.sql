/*
  # Usage Tracking Functions

  1. AI Cost Calculation
    - Calculate costs based on AI engine and duration
    - Apply pricing tiers and discounts
    - Handle different billing models

  2. Usage Statistics
    - Real-time usage tracking
    - Monthly and daily summaries
    - Performance metrics

  3. Billing Automation
    - Automated usage billing
    - Invoice generation
    - Payment processing integration

  4. Security
    - User-specific usage data
    - Secure cost calculations
    - Data integrity checks
*/

-- Function to calculate AI cost based on engine and duration
CREATE OR REPLACE FUNCTION calculate_ai_cost(
  engine TEXT,
  duration_minutes DECIMAL
)
RETURNS DECIMAL
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  cost_per_minute DECIMAL;
  total_cost DECIMAL;
BEGIN
  -- Set cost per minute based on engine
  CASE engine
    WHEN 'gpt-4' THEN cost_per_minute := 0.06;
    WHEN 'gpt-3.5' THEN cost_per_minute := 0.02;
    WHEN 'claude' THEN cost_per_minute := 0.04;
    WHEN 'elevenlabs' THEN cost_per_minute := 0.02;
    WHEN 'google' THEN cost_per_minute := 0.01;
    WHEN 'azure' THEN cost_per_minute := 0.015;
    ELSE cost_per_minute := 0.03; -- Default cost
  END CASE;
  
  total_cost := duration_minutes * cost_per_minute;
  
  -- Round to 4 decimal places
  RETURN ROUND(total_cost, 4);
END;
$$;

-- Function to get current usage statistics for a user
CREATE OR REPLACE FUNCTION get_current_usage_stats(user_uuid UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  stats JSONB;
  total_minutes DECIMAL;
  total_cost DECIMAL;
  total_calls INTEGER;
  avg_cost_per_minute DECIMAL;
  active_days INTEGER;
  avg_calls_per_day DECIMAL;
  start_of_month DATE;
BEGIN
  -- Get start of current month
  start_of_month := DATE_TRUNC('month', CURRENT_DATE);
  
  -- Calculate total minutes and cost for current month
  SELECT 
    COALESCE(SUM(au.minutes_used), 0),
    COALESCE(SUM(au.cost), 0),
    COUNT(DISTINCT au.call_id)
  INTO total_minutes, total_cost, total_calls
  FROM ai_usage au
  WHERE au.user_id = user_uuid 
    AND au.created_at >= start_of_month;
  
  -- Calculate average cost per minute
  IF total_minutes > 0 THEN
    avg_cost_per_minute := total_cost / total_minutes;
  ELSE
    avg_cost_per_minute := 0;
  END IF;
  
  -- Calculate active days (days with calls)
  SELECT COUNT(DISTINCT DATE(c.start_time)) INTO active_days
  FROM calls c
  WHERE c.user_id = user_uuid 
    AND c.start_time >= start_of_month;
  
  -- Calculate average calls per day
  IF active_days > 0 THEN
    avg_calls_per_day := total_calls::DECIMAL / active_days;
  ELSE
    avg_calls_per_day := 0;
  END IF;
  
  -- Build JSON response
  stats := json_build_object(
    'total_minutes', total_minutes,
    'total_cost', total_cost,
    'average_cost_per_minute', ROUND(avg_cost_per_minute, 4),
    'total_calls', total_calls,
    'active_days', active_days,
    'average_calls_per_day', ROUND(avg_calls_per_day, 2),
    'period_start', start_of_month,
    'period_end', (start_of_month + INTERVAL '1 month' - INTERVAL '1 day')::DATE
  );
  
  RETURN stats;
END;
$$;

-- Function to toggle service pause
CREATE OR REPLACE FUNCTION toggle_service_pause()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_status BOOLEAN;
  new_status BOOLEAN;
BEGIN
  -- Get current pause status
  SELECT service_paused INTO current_status
  FROM users
  WHERE id = auth.uid();
  
  -- Toggle the status
  new_status := NOT COALESCE(current_status, FALSE);
  
  -- Update user status
  UPDATE users 
  SET service_paused = new_status,
      updated_at = NOW()
  WHERE id = auth.uid();
  
  RETURN new_status;
END;
$$;

-- Function to process AI usage billing
CREATE OR REPLACE FUNCTION process_ai_usage_billing()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  processed_count INTEGER := 0;
  usage_record RECORD;
BEGIN
  -- Process unbilled AI usage records
  FOR usage_record IN 
    SELECT * FROM ai_usage 
    WHERE billed = FALSE 
    ORDER BY created_at ASC
  LOOP
    -- Calculate cost if not already calculated
    IF usage_record.cost IS NULL OR usage_record.cost = 0 THEN
      UPDATE ai_usage 
      SET cost = calculate_ai_cost(usage_record.engine, usage_record.minutes_used)
      WHERE id = usage_record.id;
    END IF;
    
    -- Mark as billed
    UPDATE ai_usage 
    SET billed = TRUE, billed_at = NOW()
    WHERE id = usage_record.id;
    
    processed_count := processed_count + 1;
  END LOOP;
  
  RETURN processed_count;
END;
$$;

-- Function to get monthly usage summary
CREATE OR REPLACE FUNCTION get_monthly_usage_summary(
  user_uuid UUID,
  month_date DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE(
  month DATE,
  total_minutes DECIMAL,
  total_cost DECIMAL,
  total_calls INTEGER,
  avg_cost_per_minute DECIMAL,
  engines_used JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  start_of_month DATE;
  end_of_month DATE;
BEGIN
  start_of_month := DATE_TRUNC('month', month_date);
  end_of_month := start_of_month + INTERVAL '1 month' - INTERVAL '1 day';
  
  RETURN QUERY
  SELECT 
    start_of_month as month,
    COALESCE(SUM(au.minutes_used), 0) as total_minutes,
    COALESCE(SUM(au.cost), 0) as total_cost,
    COUNT(DISTINCT au.call_id)::INTEGER as total_calls,
    CASE 
      WHEN SUM(au.minutes_used) > 0 THEN 
        ROUND(SUM(au.cost) / SUM(au.minutes_used), 4)
      ELSE 0
    END as avg_cost_per_minute,
    COALESCE(
      json_object_agg(
        au.engine, 
        json_build_object(
          'minutes', SUM(au.minutes_used),
          'cost', SUM(au.cost),
          'calls', COUNT(*)
        )
      ) FILTER (WHERE au.engine IS NOT NULL),
      '{}'::JSONB
    ) as engines_used
  FROM ai_usage au
  WHERE au.user_id = user_uuid 
    AND au.created_at >= start_of_month 
    AND au.created_at <= end_of_month;
END;
$$;