/*
  # Add Missing Constraints and Indexes

  1. Database Constraints
    - Add missing foreign key constraints
    - Ensure data integrity
    - Optimize query performance

  2. Indexes
    - Performance optimization indexes
    - Search and filter indexes
    - Composite indexes for complex queries

  3. Security
    - Ensure RLS policies are complete
    - Add missing security constraints
*/

-- Add missing constraint for sip_configurations if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name = 'sip_configurations' 
    AND constraint_name = 'unique_user_phone_sip'
  ) THEN
    ALTER TABLE sip_configurations 
    ADD CONSTRAINT unique_user_phone_sip 
    UNIQUE (user_id, phone_number);
  END IF;
END $$;

-- Add index for call states if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE tablename = 'call_states' 
    AND indexname = 'idx_call_states_call_sid'
  ) THEN
    CREATE INDEX idx_call_states_call_sid ON call_states (call_sid);
  END IF;
END $$;

-- Add index for workflows if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE tablename = 'workflows' 
    AND indexname = 'idx_workflows_user_enabled'
  ) THEN
    CREATE INDEX idx_workflows_user_enabled ON workflows (user_id, enabled) WHERE enabled = true;
  END IF;
END $$;

-- Ensure all tables have proper RLS policies
ALTER TABLE call_states ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflows ENABLE ROW LEVEL SECURITY;

-- Add RLS policy for call_states if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'call_states' 
    AND policyname = 'Users can manage their own call states'
  ) THEN
    CREATE POLICY "Users can manage their own call states"
      ON call_states
      FOR ALL
      TO authenticated
      USING (user_id = uid())
      WITH CHECK (user_id = uid());
  END IF;
END $$;

-- Add RLS policy for workflows if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'workflows' 
    AND policyname = 'Users can manage their own workflows'
  ) THEN
    CREATE POLICY "Users can manage their own workflows"
      ON workflows
      FOR ALL
      TO authenticated
      USING (user_id = uid())
      WITH CHECK (user_id = uid());
  END IF;
END $$;