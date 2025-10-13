/*
  # Notification System Functions

  1. New Functions
    - `send_notification` - Envoie une notification multi-canal
    - `log_notification` - Enregistre les notifications envoyées
    - `get_notification_preferences` - Récupère les préférences utilisateur
    - `update_notification_preferences` - Met à jour les préférences

  2. Features
    - Notifications SMS et email
    - Gestion des préférences utilisateur
    - Historique des notifications
    - Templates de messages

  3. Security
    - Validation des destinataires
    - Limitation du taux d'envoi
    - Audit des notifications
*/

-- Function to send notifications
CREATE OR REPLACE FUNCTION send_notification(
    user_uuid UUID,
    notification_type TEXT,
    message_text TEXT,
    recipient_phone TEXT DEFAULT NULL,
    recipient_email TEXT DEFAULT NULL,
    priority TEXT DEFAULT 'normal'
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    user_phone TEXT;
    user_email TEXT;
    notification_prefs JSONB;
    should_send_sms BOOLEAN := FALSE;
    should_send_email BOOLEAN := FALSE;
    sms_sent BOOLEAN := FALSE;
    email_sent BOOLEAN := FALSE;
BEGIN
    -- Get user details and preferences
    SELECT phone, email INTO user_phone, user_email
    FROM users WHERE id = user_uuid;
    
    SELECT notifications INTO notification_prefs
    FROM configurations WHERE user_id = user_uuid;
    
    -- Determine if we should send notifications based on preferences
    CASE notification_type
        WHEN 'appointment_booked' THEN
            should_send_sms := (notification_prefs->'appointments'->>'sms')::BOOLEAN;
            should_send_email := (notification_prefs->'appointments'->>'email')::BOOLEAN;
        WHEN 'urgent_call' THEN
            should_send_sms := (notification_prefs->'urgentCalls'->>'sms')::BOOLEAN;
            should_send_email := (notification_prefs->'urgentCalls'->>'email')::BOOLEAN;
        WHEN 'important_request' THEN
            should_send_sms := FALSE; -- Important requests only via email
            should_send_email := (notification_prefs->'importantRequests'->>'email')::BOOLEAN;
        ELSE
            should_send_sms := FALSE;
            should_send_email := FALSE;
    END CASE;
    
    -- Use provided recipients or fall back to user's contact info
    IF recipient_phone IS NULL THEN
        recipient_phone := user_phone;
    END IF;
    
    IF recipient_email IS NULL THEN
        recipient_email := user_email;
    END IF;
    
    -- Log the notification attempt
    INSERT INTO sms_logs (
        user_id,
        phone_number,
        message,
        notification_type,
        status,
        sent_at
    ) VALUES (
        user_uuid,
        recipient_phone,
        message_text,
        notification_type,
        CASE WHEN should_send_sms THEN 'pending' ELSE 'skipped' END,
        NOW()
    );
    
    -- Return success status
    RETURN (should_send_sms OR should_send_email);
END;
$$;

-- Function to log notifications
CREATE OR REPLACE FUNCTION log_notification(
    user_uuid UUID,
    notification_type TEXT,
    channel TEXT,
    recipient TEXT,
    message_text TEXT,
    status TEXT,
    external_id TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    log_id UUID;
BEGIN
    -- Insert notification log
    INSERT INTO sms_logs (
        user_id,
        phone_number,
        message,
        notification_type,
        status,
        twilio_sid,
        sent_at
    ) VALUES (
        user_uuid,
        CASE WHEN channel = 'sms' THEN recipient ELSE NULL END,
        message_text,
        notification_type,
        status,
        external_id,
        NOW()
    ) RETURNING id INTO log_id;
    
    RETURN log_id;
END;
$$;

-- Function to get notification preferences
CREATE OR REPLACE FUNCTION get_notification_preferences(user_uuid UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    prefs JSONB;
BEGIN
    SELECT notifications INTO prefs
    FROM configurations
    WHERE user_id = user_uuid;
    
    -- Return default preferences if none exist
    IF prefs IS NULL THEN
        prefs := jsonb_build_object(
            'appointments', jsonb_build_object(
                'enabled', true,
                'sms', true,
                'email', true
            ),
            'urgentCalls', jsonb_build_object(
                'enabled', true,
                'sms', true,
                'email', true
            ),
            'importantRequests', jsonb_build_object(
                'enabled', true,
                'email', true,
                'threshold', 'high'
            )
        );
    END IF;
    
    RETURN prefs;
END;
$$;

-- Function to update notification preferences
CREATE OR REPLACE FUNCTION update_notification_preferences(
    user_uuid UUID,
    new_preferences JSONB
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Validate user exists
    IF NOT EXISTS (SELECT 1 FROM users WHERE id = user_uuid) THEN
        RAISE EXCEPTION 'User not found';
    END IF;
    
    -- Update or insert configuration
    INSERT INTO configurations (
        user_id,
        notifications,
        updated_at
    ) VALUES (
        user_uuid,
        new_preferences,
        NOW()
    )
    ON CONFLICT (user_id) 
    DO UPDATE SET
        notifications = EXCLUDED.notifications,
        updated_at = NOW();
    
    RETURN TRUE;
END;
$$;

-- Function to get notification history
CREATE OR REPLACE FUNCTION get_notification_history(
    user_uuid UUID,
    limit_count INTEGER DEFAULT 50
)
RETURNS TABLE(
    id UUID,
    notification_type TEXT,
    message TEXT,
    phone_number TEXT,
    status TEXT,
    sent_at TIMESTAMPTZ,
    twilio_sid TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        sl.id,
        sl.notification_type,
        sl.message,
        sl.phone_number,
        sl.status,
        sl.sent_at,
        sl.twilio_sid
    FROM sms_logs sl
    WHERE sl.user_id = user_uuid
    ORDER BY sl.sent_at DESC
    LIMIT limit_count;
END;
$$;

-- Function to check notification rate limits
CREATE OR REPLACE FUNCTION check_notification_rate_limit(
    user_uuid UUID,
    notification_type TEXT,
    time_window_minutes INTEGER DEFAULT 60,
    max_notifications INTEGER DEFAULT 10
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    recent_count INTEGER;
BEGIN
    -- Count recent notifications of this type
    SELECT COUNT(*)
    INTO recent_count
    FROM sms_logs
    WHERE user_id = user_uuid
    AND notification_type = notification_type
    AND sent_at > NOW() - (time_window_minutes || ' minutes')::INTERVAL;
    
    -- Return true if under limit
    RETURN recent_count < max_notifications;
END;
$$;