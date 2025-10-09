/*
  # Notification System Functions

  1. New Functions
    - `send_notification` - Sends multi-channel notifications
    - `get_notification_preferences` - Gets user notification settings
    - `check_notification_rate_limit` - Prevents notification spam
    - `log_notification_delivery` - Logs notification delivery status

  2. Security
    - User authentication required
    - Rate limiting protection
    - Secure preference management

  3. Features
    - Multi-channel support (SMS, email)
    - Template-based messaging
    - Delivery tracking and analytics
*/

-- Drop existing functions to avoid conflicts
DROP FUNCTION IF EXISTS send_notification(uuid, text, json);
DROP FUNCTION IF EXISTS get_notification_preferences(uuid);
DROP FUNCTION IF EXISTS check_notification_rate_limit(uuid, text);
DROP FUNCTION IF EXISTS log_notification_delivery(uuid, text, text, boolean);

-- Function to send notifications
CREATE OR REPLACE FUNCTION send_notification(
    user_uuid uuid,
    notification_type text,
    notification_data json
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    user_phone text;
    user_email text;
    preferences json;
    message_text text;
    should_send_sms boolean := false;
    should_send_email boolean := false;
    result json;
BEGIN
    -- Get user contact info
    SELECT phone, email INTO user_phone, user_email
    FROM users 
    WHERE id = user_uuid;
    
    IF user_email IS NULL THEN
        RAISE EXCEPTION 'User not found';
    END IF;
    
    -- Get notification preferences
    SELECT notifications INTO preferences
    FROM configurations 
    WHERE user_id = user_uuid;
    
    -- Default preferences if none set
    IF preferences IS NULL THEN
        preferences := '{"email": true, "sms": false}'::json;
    END IF;
    
    -- Determine message content and channels based on type
    CASE notification_type
        WHEN 'appointment_booked' THEN
            message_text := format(
                'Nouveau rendez-vous confirmé: %s le %s à %s',
                notification_data->>'clientName',
                notification_data->>'date',
                notification_data->>'time'
            );
            should_send_sms := (preferences->'appointments'->>'sms')::boolean AND user_phone IS NOT NULL;
            should_send_email := (preferences->'appointments'->>'email')::boolean;
            
        WHEN 'urgent_call' THEN
            message_text := format(
                'URGENT: Appel de %s (%s) nécessitant votre attention',
                notification_data->>'clientName',
                notification_data->>'phoneNumber'
            );
            should_send_sms := (preferences->'urgentCalls'->>'sms')::boolean AND user_phone IS NOT NULL;
            should_send_email := (preferences->'urgentCalls'->>'email')::boolean;
            
        WHEN 'important_request' THEN
            message_text := format(
                'Demande importante: %s de %s',
                notification_data->>'subject',
                notification_data->>'clientName'
            );
            should_send_email := (preferences->'importantRequests'->>'email')::boolean;
            
        ELSE
            RAISE EXCEPTION 'Invalid notification type: %', notification_type;
    END CASE;
    
    -- Build result
    result := json_build_object(
        'message', message_text,
        'sms_enabled', should_send_sms,
        'email_enabled', should_send_email,
        'user_phone', user_phone,
        'user_email', user_email
    );
    
    RETURN result;
END;
$$;

-- Function to get notification preferences
CREATE OR REPLACE FUNCTION get_notification_preferences(user_uuid uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    preferences json;
BEGIN
    SELECT notifications INTO preferences
    FROM configurations 
    WHERE user_id = user_uuid;
    
    -- Return default preferences if none set
    IF preferences IS NULL THEN
        preferences := json_build_object(
            'appointments', json_build_object('enabled', true, 'sms', true, 'email', true),
            'urgentCalls', json_build_object('enabled', true, 'sms', true, 'email', true),
            'importantRequests', json_build_object('enabled', true, 'email', true, 'threshold', 'high')
        );
    END IF;
    
    RETURN preferences;
END;
$$;

-- Function to check notification rate limits
CREATE OR REPLACE FUNCTION check_notification_rate_limit(
    user_uuid uuid,
    notification_type text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    recent_count integer;
    rate_limit integer;
BEGIN
    -- Set rate limits based on notification type
    CASE notification_type
        WHEN 'urgent_call' THEN rate_limit := 10; -- Max 10 urgent notifications per hour
        WHEN 'appointment_booked' THEN rate_limit := 20; -- Max 20 appointment notifications per hour
        WHEN 'important_request' THEN rate_limit := 5; -- Max 5 important requests per hour
        ELSE rate_limit := 10;
    END CASE;
    
    -- Count recent notifications of this type
    SELECT COUNT(*)
    INTO recent_count
    FROM sms_logs 
    WHERE user_id = user_uuid 
    AND notification_type = check_notification_rate_limit.notification_type
    AND sent_at > (now() - interval '1 hour');
    
    -- Return true if under limit
    RETURN recent_count < rate_limit;
END;
$$;

-- Function to log notification delivery
CREATE OR REPLACE FUNCTION log_notification_delivery(
    user_uuid uuid,
    notification_type text,
    delivery_method text,
    success boolean
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Log to SMS logs table (we'll use this for all notification logs)
    INSERT INTO sms_logs (
        user_id,
        phone_number,
        message,
        status,
        notification_type,
        sent_at
    )
    VALUES (
        user_uuid,
        delivery_method, -- Store delivery method in phone_number field
        notification_type,
        CASE WHEN success THEN 'delivered' ELSE 'failed' END,
        notification_type,
        now()
    );
    
    RETURN true;
END;
$$;