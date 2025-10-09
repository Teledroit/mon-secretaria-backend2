/*
  # Add voice type column to configurations table

  1. Changes
    - Add voice_type column to configurations table
    - Set default value to 'female'
    - Add comment explaining the column purpose
*/

ALTER TABLE configurations
ADD COLUMN voice_type text DEFAULT 'female';

COMMENT ON COLUMN configurations.voice_type IS 'Voice type preference (female/male) for TTS engines';