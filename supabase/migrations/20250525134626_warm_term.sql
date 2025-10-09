/*
  # Fix Settings Persistence Issues

  1. Changes
    - Make voice_id nullable to support non-ElevenLabs TTS engines
    - Make transfer_number nullable
    - Add trigger to handle settings updates
    - Add function to validate settings

  2. Security
    - Maintain existing RLS policies
    - Add validation for settings updates
*/

-- Make voice_id nullable
ALTER TABLE configurations
ALTER COLUMN voice_id DROP NOT NULL;

-- Make transfer_number nullable if not already
DO $$ 
BEGIN
  ALTER TABLE configurations
  ALTER COLUMN transfer_number DROP NOT NULL;
EXCEPTION
  WHEN others THEN
    NULL;
END $$;

-- Create function to validate settings
CREATE OR REPLACE FUNCTION validate_configuration_settings()
RETURNS trigger AS $$
BEGIN
  -- Validate working hours
  IF NEW.working_hours_start IS NOT NULL AND NEW.working_hours_end IS NOT NULL THEN
    IF NEW.working_hours_start >= NEW.working_hours_end THEN
      RAISE EXCEPTION 'Working hours start must be before end time';
    END IF;
  END IF;

  -- Validate working days array
  IF NEW.working_days IS NOT NULL THEN
    IF NOT (
      SELECT bool_and(day = ANY(ARRAY['monday','tuesday','wednesday','thursday','friday','saturday','sunday']))
      FROM unnest(NEW.working_days) AS day
    ) THEN
      RAISE EXCEPTION 'Invalid working day in array';
    END IF;
  END IF;

  -- Validate numeric ranges
  IF NEW.latency IS NOT NULL AND (NEW.latency < 0 OR NEW.latency > 1) THEN
    RAISE EXCEPTION 'Latency must be between 0 and 1';
  END IF;

  IF NEW.interruption_sensitivity IS NOT NULL AND (NEW.interruption_sensitivity < 0 OR NEW.interruption_sensitivity > 1) THEN
    RAISE EXCEPTION 'Interruption sensitivity must be between 0 and 1';
  END IF;

  IF NEW.max_call_duration IS NOT NULL AND (NEW.max_call_duration < 1 OR NEW.max_call_duration > 60) THEN
    RAISE EXCEPTION 'Max call duration must be between 1 and 60 minutes';
  END IF;

  IF NEW.silence_timeout IS NOT NULL AND (NEW.silence_timeout < 1 OR NEW.silence_timeout > 20) THEN
    RAISE EXCEPTION 'Silence timeout must be between 1 and 20 minutes';
  END IF;

  -- Set default notifications if null
  IF NEW.notifications IS NULL THEN
    NEW.notifications := jsonb_build_object('email', true, 'sms', false);
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for settings validation
DROP TRIGGER IF EXISTS validate_configuration_settings_trigger ON configurations;
CREATE TRIGGER validate_configuration_settings_trigger
  BEFORE INSERT OR UPDATE ON configurations
  FOR EACH ROW
  EXECUTE FUNCTION validate_configuration_settings();