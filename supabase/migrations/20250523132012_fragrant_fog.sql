/*
  # Add privacy settings column to configurations table

  1. Changes
    - Add `privacy_settings` JSONB column to configurations table
    - Set default value to empty JSON object
    - Add comment explaining the column purpose

  2. Notes
    - Using JSONB for flexible privacy settings storage
    - Default empty object prevents null values
*/

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'configurations' 
    AND column_name = 'privacy_settings'
  ) THEN
    ALTER TABLE configurations 
    ADD COLUMN privacy_settings JSONB DEFAULT '{}'::jsonb;

    COMMENT ON COLUMN configurations.privacy_settings IS 
    'Stores user privacy preferences and settings as a JSON object';
  END IF;
END $$;