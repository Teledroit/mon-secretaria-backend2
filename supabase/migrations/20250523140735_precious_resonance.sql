/*
  # Add notifications columns to configurations table

  1. Changes
    - Add notifications_email and notifications_sms columns
    - Set default values for notifications
    - Add comments for clarity

  2. Security
    - Maintain existing RLS policies
*/

-- Add notifications columns
ALTER TABLE configurations
ADD COLUMN IF NOT EXISTS notifications jsonb DEFAULT jsonb_build_object(
  'email', true,
  'sms', false
);

-- Add comment for clarity
COMMENT ON COLUMN configurations.notifications IS 'User notification preferences for email and SMS';