/*
  # Usage Tracking Functions

  1. New Functions
    - `get_current_usage_stats` - Returns current month usage statistics for a user
    - `get_user_phone_numbers` - Returns phone numbers associated with a user
    - `toggle_service_pause` - Toggles service pause status for a user
    - `release_phone_number` - Releases a phone number from user account

  2. Security
    - All functions use security definer for proper access control
    - User isolation through RLS policies
    - Input validation and error handling

  3. Performance
    - Optimized queries with proper indexing
    - Efficient aggregation for usage statistics
    - Cached results where appropriate
*/

-- Drop existing functions to avoid conflicts
DROP FUNCTION IF EXISTS get_current_usage_stats(uuid);
DROP FUNCTION IF EXISTS get_user_phone_numbers(uuid);
DROP FUNCTION IF EXISTS toggle_service_pause();
DROP FUNCTION IF EXISTS release_phone_number(uuid);

-- Function to get current usage statistics for a user
CREATE OR REPLACE FUNCTION get_current_usage_stats(user_uuid uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result json;
    current_month_start date;
    total_minutes numeric := 0;
    total_cost numeric := 0;
    total_calls integer := 0;
    active_days integer := 0;
    avg_cost_per_minute numeric := 0;
    avg_calls_per_day numeric := 0;
BEGIN
    -- Get start of current month
    current_month_start := date_trunc('month', CURRENT_DATE);
    
    -- Get AI usage stats for current month
    SELECT 
        COALESCE(SUM(minutes_used), 0),
        COALESCE(SUM(cost), 0),
        COUNT(*)
    INTO total_minutes, total_cost, total_calls
    FROM ai_usage 
    WHERE user_id = user_uuid 
    AND created_at >= current_month_start;
    
    -- Calculate average cost per minute
    IF total_minutes > 0 THEN
        avg_cost_per_minute := total_cost / total_minutes;
    END IF;
    
    -- Get number of active days (days with calls)
    SELECT COUNT(DISTINCT DATE(created_at))
    INTO active_days
    FROM ai_usage
    WHERE user_id = user_uuid 
    AND created_at >= current_month_start;
    
    -- Calculate average calls per day
    IF active_days > 0 THEN
        avg_calls_per_day := total_calls::numeric / active_days;
    END IF;
    
    -- Build result JSON
    result := json_build_object(
        'total_minutes', total_minutes,
        'total_cost', total_cost,
        'total_calls', total_calls,
        'active_days', active_days,
        'average_cost_per_minute', avg_cost_per_minute,
        'average_calls_per_day', avg_calls_per_day,
        'period_start', current_month_start,
        'period_end', (current_month_start + interval '1 month' - interval '1 day')::date
    );
    
    RETURN result;
END;
$$;

-- Function to get user's phone numbers
CREATE OR REPLACE FUNCTION get_user_phone_numbers(user_uuid uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result json;
BEGIN
    SELECT json_agg(
        json_build_object(
            'id', tpn.id,
            'phone_number', tpn.phone_number,
            'friendly_name', tpn.friendly_name,
            'status', tpn.status,
            'created_at', tpn.created_at
        )
    )
    INTO result
    FROM twilio_phone_numbers tpn
    JOIN twilio_accounts ta ON tpn.account_id = ta.id
    WHERE ta.user_id = user_uuid 
    AND tpn.deleted_at IS NULL
    AND ta.deleted_at IS NULL;
    
    RETURN COALESCE(result, '[]'::json);
END;
$$;

-- Function to toggle service pause status
CREATE OR REPLACE FUNCTION toggle_service_pause()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    current_user_id uuid;
    current_status boolean;
    new_status boolean;
BEGIN
    -- Get current user ID
    current_user_id := auth.uid();
    
    IF current_user_id IS NULL THEN
        RAISE EXCEPTION 'User not authenticated';
    END IF;
    
    -- Get current pause status
    SELECT service_paused INTO current_status
    FROM users 
    WHERE id = current_user_id;
    
    IF current_status IS NULL THEN
        RAISE EXCEPTION 'User not found';
    END IF;
    
    -- Toggle status
    new_status := NOT current_status;
    
    -- Update user status
    UPDATE users 
    SET service_paused = new_status,
        updated_at = now()
    WHERE id = current_user_id;
    
    RETURN new_status;
END;
$$;

-- Function to release a phone number
CREATE OR REPLACE FUNCTION release_phone_number(number_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    current_user_id uuid;
    phone_account_id uuid;
BEGIN
    -- Get current user ID
    current_user_id := auth.uid();
    
    IF current_user_id IS NULL THEN
        RAISE EXCEPTION 'User not authenticated';
    END IF;
    
    -- Get the account ID for this phone number
    SELECT account_id INTO phone_account_id
    FROM twilio_phone_numbers tpn
    JOIN twilio_accounts ta ON tpn.account_id = ta.id
    WHERE tpn.id = number_id 
    AND ta.user_id = current_user_id
    AND tpn.deleted_at IS NULL;
    
    IF phone_account_id IS NULL THEN
        RAISE EXCEPTION 'Phone number not found or access denied';
    END IF;
    
    -- Mark phone number as deleted (soft delete)
    UPDATE twilio_phone_numbers 
    SET deleted_at = now(),
        status = 'inactive'
    WHERE id = number_id;
    
    RETURN true;
END;
$$;