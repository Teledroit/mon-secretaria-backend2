/*
  # Add Missing Constraints and Indexes

  1. Database Optimizations
    - Performance indexes for frequently queried columns
    - Data validation constraints
    - Improved query performance

  2. Security Enhancements
    - Complete RLS policies for all tables
    - Data integrity constraints
    - Access control improvements

  3. Performance Improvements
    - Optimized indexes for search operations
    - Composite indexes for complex queries
    - Foreign key performance optimization
*/

-- Add performance indexes
CREATE INDEX IF NOT EXISTS idx_calls_user_id_start_time ON calls(user_id, start_time DESC);
CREATE INDEX IF NOT EXISTS idx_calls_status ON calls(status) WHERE status != 'completed';
CREATE INDEX IF NOT EXISTS idx_calls_phone_number ON calls(phone_number);

CREATE INDEX IF NOT EXISTS idx_transcriptions_call_id ON transcriptions(call_id);
CREATE INDEX IF NOT EXISTS idx_transcriptions_timestamp ON transcriptions(timestamp);

CREATE INDEX IF NOT EXISTS idx_ai_usage_user_id_created_at ON ai_usage(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_usage_billed ON ai_usage(billed) WHERE NOT billed;

CREATE INDEX IF NOT EXISTS idx_appointments_user_id_start_time ON appointments(user_id, start_time) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_configurations_user_id ON configurations(user_id);

-- Add data validation constraints
ALTER TABLE calls ADD CONSTRAINT check_calls_cost_positive CHECK (cost IS NULL OR cost >= 0);
ALTER TABLE calls ADD CONSTRAINT check_calls_duration_positive CHECK (duration IS NULL OR duration >= INTERVAL '0 seconds');

ALTER TABLE ai_usage ADD CONSTRAINT check_ai_usage_minutes_positive CHECK (minutes_used >= 0);
ALTER TABLE ai_usage ADD CONSTRAINT check_ai_usage_cost_positive CHECK (cost >= 0);

ALTER TABLE configurations ADD CONSTRAINT check_temperature_range CHECK (temperature >= 0 AND temperature <= 1);
ALTER TABLE configurations ADD CONSTRAINT check_latency_range CHECK (latency >= 0 AND latency <= 1);
ALTER TABLE configurations ADD CONSTRAINT check_interruption_sensitivity_range CHECK (interruption_sensitivity >= 0 AND interruption_sensitivity <= 1);
ALTER TABLE configurations ADD CONSTRAINT check_max_call_duration_positive CHECK (max_call_duration > 0);
ALTER TABLE configurations ADD CONSTRAINT check_silence_timeout_positive CHECK (silence_timeout > 0);

-- Add missing RLS policies
DO $$
BEGIN
  -- Check if policy exists before creating
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