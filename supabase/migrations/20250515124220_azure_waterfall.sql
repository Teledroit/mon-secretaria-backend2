/*
  # Add Email Notification Trigger

  1. New Function
    - Creates a PostgreSQL function to send email notifications
    - Uses pg_notify to trigger email sending
    - Includes message details in the notification payload

  2. New Trigger
    - Adds trigger on contact_messages table
    - Fires after INSERT
    - Calls notification function
*/

-- First, create the notification function
CREATE OR REPLACE FUNCTION send_email_notification()
RETURNS trigger AS $$
BEGIN
  -- Construct the notification payload
  PERFORM pg_notify(
    'contact_message_notifications',
    json_build_object(
      'name', NEW.name,
      'email', NEW.email,
      'phone', NEW.phone,
      'message', NEW.message,
      'created_at', NEW.created_at
    )::text
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Then, create the trigger
DROP TRIGGER IF EXISTS contact_message_insert ON contact_messages;

CREATE TRIGGER contact_message_insert
  AFTER INSERT ON contact_messages
  FOR EACH ROW
  EXECUTE FUNCTION send_email_notification();