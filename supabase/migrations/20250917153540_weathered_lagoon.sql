/*
  # Create workflows table

  1. New Tables
    - `workflows`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to users)
      - `name` (text, workflow name)
      - `trigger` (text, trigger keywords/conditions)
      - `steps` (jsonb, workflow steps configuration)
      - `enabled` (boolean, whether workflow is active)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `workflows` table
    - Add policy for users to manage their own workflows

  3. Indexes
    - Index on user_id for user-specific queries
    - Index on enabled status for active workflows
*/

-- Create workflows table
CREATE TABLE IF NOT EXISTS workflows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id),
  name text NOT NULL,
  trigger_keywords text NOT NULL,
  steps jsonb NOT NULL DEFAULT '[]',
  enabled boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE workflows ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can manage their own workflows"
  ON workflows
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_workflows_user_id ON workflows(user_id);
CREATE INDEX IF NOT EXISTS idx_workflows_enabled ON workflows(enabled) WHERE enabled = true;
CREATE INDEX IF NOT EXISTS idx_workflows_trigger ON workflows USING GIN (to_tsvector('french', trigger_keywords));

-- Function to get active workflows for a user
CREATE OR REPLACE FUNCTION get_active_workflows(p_user_id uuid)
RETURNS TABLE (
  id uuid,
  name text,
  trigger_keywords text,
  steps jsonb
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    w.id,
    w.name,
    w.trigger_keywords,
    w.steps
  FROM workflows w
  WHERE 
    w.user_id = p_user_id 
    AND w.enabled = true
  ORDER BY w.created_at DESC;
END;
$$;