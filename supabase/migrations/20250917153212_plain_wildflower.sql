/*
  # Create call states table for conversation management

  1. New Tables
    - `call_states`
      - `id` (uuid, primary key)
      - `call_sid` (text, unique identifier from Twilio)
      - `user_id` (uuid, foreign key to users)
      - `state_data` (jsonb, stores conversation history and context)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `call_states` table
    - Add policy for users to manage their own call states
    - Add cleanup function for old states

  3. Indexes
    - Index on call_sid for fast lookups
    - Index on user_id for user-specific queries
    - Index on updated_at for cleanup operations
*/

-- Create call_states table
CREATE TABLE IF NOT EXISTS call_states (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  call_sid text NOT NULL,
  user_id uuid NOT NULL REFERENCES users(id),
  state_data jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(call_sid, user_id)
);

-- Enable RLS
ALTER TABLE call_states ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can manage their own call states"
  ON call_states
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_call_states_call_sid ON call_states(call_sid);
CREATE INDEX IF NOT EXISTS idx_call_states_user_id ON call_states(user_id);
CREATE INDEX IF NOT EXISTS idx_call_states_updated_at ON call_states(updated_at);

-- Function to cleanup old call states (older than 24 hours)
CREATE OR REPLACE FUNCTION cleanup_old_call_states()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  DELETE FROM call_states 
  WHERE updated_at < now() - interval '24 hours';
END;
$$;

-- Create a scheduled job to run cleanup (this would need to be set up in Supabase dashboard)
-- SELECT cron.schedule('cleanup-call-states', '0 2 * * *', 'SELECT cleanup_old_call_states();');