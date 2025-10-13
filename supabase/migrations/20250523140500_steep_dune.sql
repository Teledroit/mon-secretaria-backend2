/*
  # Add General Settings Columns

  1. Changes
    - Add columns for general settings configuration
    - Set appropriate default values
    - Add comments for clarity

  2. Security
    - Existing RLS policies will handle access control
*/

-- Add new columns for general settings
ALTER TABLE configurations
ADD COLUMN IF NOT EXISTS detect_voicemail boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS max_call_duration integer DEFAULT 20,
ADD COLUMN IF NOT EXISTS silence_timeout integer DEFAULT 5,
ADD COLUMN IF NOT EXISTS latency decimal(3,2) DEFAULT 0.5,
ADD COLUMN IF NOT EXISTS interruption_sensitivity decimal(3,2) DEFAULT 0.7,
ADD COLUMN IF NOT EXISTS enable_backchanneling boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS enable_speech_normalization boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS working_hours_start time DEFAULT '09:00',
ADD COLUMN IF NOT EXISTS working_hours_end time DEFAULT '18:00',
ADD COLUMN IF NOT EXISTS working_days text[] DEFAULT ARRAY['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
ADD COLUMN IF NOT EXISTS transfer_number text,
ADD COLUMN IF NOT EXISTS notifications_email boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS notifications_sms boolean DEFAULT false;

-- Add comments for clarity
COMMENT ON COLUMN configurations.detect_voicemail IS 'Whether to end call when voicemail is detected';
COMMENT ON COLUMN configurations.max_call_duration IS 'Maximum call duration in minutes';
COMMENT ON COLUMN configurations.silence_timeout IS 'Time in minutes before ending call due to silence';
COMMENT ON COLUMN configurations.latency IS 'Response latency (0-1 scale)';
COMMENT ON COLUMN configurations.interruption_sensitivity IS 'Sensitivity to interruptions (0-1 scale)';
COMMENT ON COLUMN configurations.enable_backchanneling IS 'Whether to use active listening signals';
COMMENT ON COLUMN configurations.enable_speech_normalization IS 'Whether to normalize speech patterns';
COMMENT ON COLUMN configurations.working_hours_start IS 'Start of working hours';
COMMENT ON COLUMN configurations.working_hours_end IS 'End of working hours';
COMMENT ON COLUMN configurations.working_days IS 'Array of active working days';
COMMENT ON COLUMN configurations.transfer_number IS 'Number to transfer calls to';
COMMENT ON COLUMN configurations.notifications_email IS 'Whether to send email notifications';
COMMENT ON COLUMN configurations.notifications_sms IS 'Whether to send SMS notifications';