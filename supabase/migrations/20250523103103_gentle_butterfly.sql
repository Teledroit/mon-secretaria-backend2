/*
  # Enhance Appointments and Calls

  1. Changes
    - Add client_phone to appointments table
    - Add client_name to calls table
    - Add sentiment_summary to transcriptions table
    - Add appointment_type to transcriptions table
    - Add indexes for better query performance

  2. Security
    - Maintain existing RLS policies
*/

-- Add client_phone to appointments
ALTER TABLE appointments
ADD COLUMN IF NOT EXISTS client_phone text;

-- Add client_name to calls
ALTER TABLE calls
ADD COLUMN IF NOT EXISTS client_name text;

-- Add sentiment_summary and appointment_type to transcriptions
ALTER TABLE transcriptions
ADD COLUMN IF NOT EXISTS sentiment_summary text,
ADD COLUMN IF NOT EXISTS appointment_type text;

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_transcriptions_sentiment 
ON transcriptions(sentiment)
WHERE sentiment IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_transcriptions_appointment_type 
ON transcriptions(appointment_type)
WHERE appointment_type IS NOT NULL;

-- Update the transcriptions trigger to include sentiment analysis
CREATE OR REPLACE FUNCTION process_transcription()
RETURNS trigger AS $$
BEGIN
  -- Set sentiment_summary based on sentiment patterns
  NEW.sentiment_summary := 
    CASE
      WHEN NEW.sentiment LIKE '%positive%' THEN 'positif'
      WHEN NEW.sentiment LIKE '%negative%' THEN 'négatif'
      ELSE 'neutre'
    END;
    
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create or replace the trigger
DROP TRIGGER IF EXISTS transcription_processing ON transcriptions;
CREATE TRIGGER transcription_processing
  BEFORE INSERT ON transcriptions
  FOR EACH ROW
  EXECUTE FUNCTION process_transcription();