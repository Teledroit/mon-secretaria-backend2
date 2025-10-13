/*
  # Create Missing Tables

  1. New Tables
    - `call_states` for conversation state management
    - `workflows` for custom workflow configuration

  2. Missing Columns
    - Add `client_email` to appointments table
    - Add `specific_instructions` to configurations table

  3. Security
    - Enable RLS on all new tables
    - Add appropriate policies for user access
*/

-- Create call_states table if it doesn't exist
CREATE TABLE IF NOT EXISTS call_states (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  call_sid TEXT NOT NULL,
  user_id UUID NOT NULL REFERENCES users(id),
  state_data JSONB NOT NULL DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(call_sid, user_id)
);

-- Create workflows table if it doesn't exist
CREATE TABLE IF NOT EXISTS workflows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  name TEXT NOT NULL,
  trigger_keywords TEXT NOT NULL,
  steps JSONB NOT NULL DEFAULT '[]'::JSONB,
  enabled BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add missing columns to existing tables
DO $$
BEGIN
  -- Add client_email to appointments if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'appointments' AND column_name = 'client_email'
  ) THEN
    ALTER TABLE appointments ADD COLUMN client_email TEXT;
  END IF;

  -- Add specific_instructions to configurations if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'configurations' AND column_name = 'specific_instructions'
  ) THEN
    ALTER TABLE configurations ADD COLUMN specific_instructions TEXT;
  END IF;
END $$;

-- Enable RLS on new tables
ALTER TABLE call_states ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflows ENABLE ROW LEVEL SECURITY;

-- Create policies for call_states
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'call_states' 
    AND policyname = 'Users can manage their own call states'
  ) THEN
    CREATE POLICY "Users can manage their own call states"
      ON call_states
      FOR ALL
      TO authenticated
      USING (user_id = auth.uid())
      WITH CHECK (user_id = auth.uid());
  END IF;
END $$;

-- Create policies for workflows
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'workflows' 
    AND policyname = 'Users can manage their own workflows'
  ) THEN
    CREATE POLICY "Users can manage their own workflows"
      ON workflows
      FOR ALL
      TO authenticated
      USING (user_id = auth.uid())
      WITH CHECK (user_id = auth.uid());
  END IF;
END $$;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_call_states_call_sid ON call_states(call_sid);
CREATE INDEX IF NOT EXISTS idx_call_states_user_id ON call_states(user_id);
CREATE INDEX IF NOT EXISTS idx_call_states_updated_at ON call_states(updated_at);

CREATE INDEX IF NOT EXISTS idx_workflows_user_id ON workflows(user_id);
CREATE INDEX IF NOT EXISTS idx_workflows_enabled ON workflows(enabled) WHERE enabled = TRUE;
CREATE INDEX IF NOT EXISTS idx_workflows_trigger ON workflows USING gin(to_tsvector('french', trigger_keywords));
CREATE INDEX IF NOT EXISTS idx_workflows_user_enabled ON workflows(user_id, enabled) WHERE enabled = TRUE;