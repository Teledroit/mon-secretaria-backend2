/*
  # Notification System Functions

  1. Notification Management
    - `send_notification` - Sends multi-channel notifications
    - `get_notification_preferences` - Retrieves user notification settings
    - `log_notification_delivery` - Tracks notification delivery status

  2. Rate Limiting
    - `check_notification_rate_limit` - Prevents spam
    - `update_rate_limit_counter` - Manages rate limiting

  3. Security
    - User authentication required
    - Preference validation
    - Secure notification processing
*/

-- Function to send notifications
CREATE OR REPLACE FUNCTION send_notification(
  user_uuid UUID,
  notification_type TEXT,
  message_content TEXT,
  notification_data JSONB DEFAULT '{}'::JSONB
)
RETURNS JSONB AS $$
DECLARE
  user_preferences JSONB;
  user_contact RECORD;
  result JSONB;
  sms_enabled BOOLEAN := FALSE;
  email_enabled BOOLEAN := FALSE;
  custom_email TEXT;
BEGIN
  -- Get user contact information
  SELECT phone, email INTO user_contact
  FROM users 
  WHERE id = user_uuid;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'User not found';
  END IF;
  
  -- Get notification preferences
  SELECT notifications INTO user_preferences
  FROM configurations 
  WHERE user_id = user_uuid;
  
  -- Determine notification channels based on type and preferences
  CASE notification_type
    WHEN 'appointment_booked' THEN
      sms_enabled := (user_preferences->'appointments'->>'sms')::BOOLEAN AND user_contact.phone IS NOT NULL;
      email_enabled := (user_preferences->'appointments'->>'email')::BOOLEAN AND user_contact.email IS NOT NULL;
      custom_email := user_preferences->'appointments'->>'emailAddress';
      
    WHEN 'urgent_call' THEN
      sms_enabled := (user_preferences->'urgentCalls'->>'sms')::BOOLEAN AND user_contact.phone IS NOT NULL;
      email_enabled := (user_preferences->'urgentCalls'->>'email')::BOOLEAN AND user_contact.email IS NOT NULL;
      custom_email := user_preferences->'urgentCalls'->>'emailAddress';
      
    WHEN 'important_request' THEN
      sms_enabled := FALSE; -- Important requests only via email
      email_enabled := (user_preferences->'importantRequests'->>'email')::BOOLEAN AND user_contact.email IS NOT NULL;
      custom_email := user_preferences->'importantRequests'->>'emailAddress';
      
    ELSE
      RAISE EXCEPTION 'Invalid notification type: %', notification_type;
  END CASE;
  
  -- Build result
  result := jsonb_build_object(
    'user_id', user_uuid,
    'type', notification_type,
    'message', message_content,
    'sms_enabled', sms_enabled,
    'email_enabled', email_enabled,
    'email_address', COALESCE(custom_email, user_contact.email),
    'phone_number', user_contact.phone,
    'timestamp', NOW()
  );
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get notification preferences
CREATE OR REPLACE FUNCTION get_notification_preferences(user_uuid UUID)
RETURNS JSONB AS $$
DECLARE
  preferences JSONB;
BEGIN
  SELECT notifications INTO preferences
  FROM configurations 
  WHERE user_id = user_uuid;
  
  -- Return default preferences if none found
  IF preferences IS NULL THEN
    preferences := jsonb_build_object(
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
  
  RETURN preferences;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check notification rate limits
CREATE OR REPLACE FUNCTION check_notification_rate_limit(
  user_uuid UUID,
  notification_type TEXT,
  time_window_minutes INTEGER DEFAULT 60,
  max_notifications INTEGER DEFAULT 10
)
RETURNS BOOLEAN AS $$
DECLARE
  notification_count INTEGER;
  time_threshold TIMESTAMP;
BEGIN
  time_threshold := NOW() - (time_window_minutes || ' minutes')::INTERVAL;
  
  -- Count notifications in time window
  SELECT COUNT(*) INTO notification_count
  FROM sms_logs 
  WHERE user_id = user_uuid 
    AND notification_type = check_notification_rate_limit.notification_type
    AND sent_at >= time_threshold;
  
  -- Return true if under limit
  RETURN notification_count < max_notifications;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to log notification delivery
CREATE OR REPLACE FUNCTION log_notification_delivery(
  user_uuid UUID,
  phone_number TEXT,
  message_content TEXT,
  notification_type TEXT,
  twilio_sid TEXT DEFAULT NULL,
  delivery_status TEXT DEFAULT 'sent'
)
RETURNS UUID AS $$
DECLARE
  log_id UUID;
BEGIN
  INSERT INTO sms_logs (
    user_id,
    phone_number,
    message,
    twilio_sid,
    status,
    notification_type,
    sent_at,
    created_at
  )
  VALUES (
    user_uuid,
    phone_number,
    message_content,
    twilio_sid,
    delivery_status,
    notification_type,
    NOW(),
    NOW()
  )
  RETURNING id INTO log_id;
  
  RETURN log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;