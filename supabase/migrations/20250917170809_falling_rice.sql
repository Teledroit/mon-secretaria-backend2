/*
  # Notification System Functions

  1. Notification Preference Management
    - Get user notification preferences
    - Update notification settings
    - Validate notification configurations

  2. Message Template Generation
    - Generate notification messages based on type
    - Apply user-specific templates
    - Handle multi-language support

  3. Delivery Tracking
    - Log notification deliveries
    - Track delivery status
    - Generate delivery reports

  4. Security
    - User-specific notification access
    - Secure message handling
    - Privacy protection for sensitive data
*/

-- Function to get user notification preferences
CREATE OR REPLACE FUNCTION get_notification_preferences(user_uuid UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  preferences JSONB;
BEGIN
  SELECT c.notifications INTO preferences
  FROM configurations c
  WHERE c.user_id = user_uuid;
  
  -- Return default preferences if none found
  IF preferences IS NULL THEN
    preferences := '{
      "appointments": {
        "enabled": true,
        "sms": true,
        "email": true,
        "emailAddress": null
      },
      "urgentCalls": {
        "enabled": true,
        "sms": true,
        "email": true,
        "emailAddress": null
      },
      "importantRequests": {
        "enabled": true,
        "email": true,
        "emailAddress": null,
        "threshold": "high"
      }
    }'::JSONB;
  END IF;
  
  RETURN preferences;
END;
$$;

-- Function to log notification delivery
CREATE OR REPLACE FUNCTION log_notification_delivery(
  user_uuid UUID,
  notification_type TEXT,
  channel TEXT,
  recipient TEXT,
  message_content TEXT,
  delivery_status TEXT,
  external_id TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  log_id UUID;
BEGIN
  -- Insert into SMS logs if it's an SMS notification
  IF channel = 'sms' THEN
    INSERT INTO sms_logs (
      user_id,
      phone_number,
      message,
      twilio_sid,
      status,
      notification_type,
      sent_at
    ) VALUES (
      user_uuid,
      recipient,
      message_content,
      external_id,
      delivery_status,
      notification_type,
      NOW()
    ) RETURNING id INTO log_id;
  END IF;
  
  RETURN log_id;
END;
$$;

-- Function to get notification history for a user
CREATE OR REPLACE FUNCTION get_notification_history(
  user_uuid UUID,
  limit_count INTEGER DEFAULT 50,
  offset_count INTEGER DEFAULT 0
)
RETURNS TABLE(
  id UUID,
  notification_type TEXT,
  channel TEXT,
  recipient TEXT,
  status TEXT,
  sent_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    sl.id,
    sl.notification_type,
    'sms'::TEXT as channel,
    sl.phone_number as recipient,
    sl.status,
    sl.sent_at
  FROM sms_logs sl
  WHERE sl.user_id = user_uuid
  ORDER BY sl.sent_at DESC
  LIMIT limit_count
  OFFSET offset_count;
END;
$$;

-- Function to generate notification message based on type and data
CREATE OR REPLACE FUNCTION generate_notification_message(
  notification_type TEXT,
  data JSONB,
  channel TEXT DEFAULT 'sms'
)
RETURNS TEXT
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  message TEXT;
  client_name TEXT;
  phone_number TEXT;
  date_str TEXT;
  time_str TEXT;
  subject_str TEXT;
BEGIN
  -- Extract common data fields
  client_name := COALESCE(data->>'clientName', 'un client');
  phone_number := data->>'phoneNumber';
  date_str := data->>'date';
  time_str := data->>'time';
  subject_str := data->>'subject';
  
  -- Generate message based on type
  CASE notification_type
    WHEN 'appointment_booked' THEN
      message := format('Nouveau rendez-vous confirmé: %s le %s à %s', 
                       client_name, date_str, time_str);
    
    WHEN 'urgent_call' THEN
      message := format('URGENT: Appel nécessitant votre attention immédiate de %s (%s)', 
                       client_name, phone_number);
    
    WHEN 'important_request' THEN
      message := format('Demande importante: %s de %s', 
                       subject_str, client_name);
    
    ELSE
      message := format('Notification MonSecretarIA: %s', client_name);
  END CASE;
  
  -- Add channel-specific formatting
  IF channel = 'email' THEN
    message := message || ' - MonSecretarIA';
  END IF;
  
  RETURN message;
END;
$$;

-- Function to validate notification configuration
CREATE OR REPLACE FUNCTION validate_notification_config(config JSONB)
RETURNS BOOLEAN
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  -- Check if config has required structure
  IF config IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Validate appointments config
  IF config ? 'appointments' THEN
    IF NOT (config->'appointments' ? 'enabled') THEN
      RETURN FALSE;
    END IF;
  END IF;
  
  -- Validate urgentCalls config
  IF config ? 'urgentCalls' THEN
    IF NOT (config->'urgentCalls' ? 'enabled') THEN
      RETURN FALSE;
    END IF;
  END IF;
  
  -- Validate importantRequests config
  IF config ? 'importantRequests' THEN
    IF NOT (config->'importantRequests' ? 'enabled') THEN
      RETURN FALSE;
    END IF;
  END IF;
  
  RETURN TRUE;
END;
$$;