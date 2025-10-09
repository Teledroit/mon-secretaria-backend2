/*
  # Add AI Usage Tracking

  1. New Tables
    - `ai_usage`: Tracks AI usage per user
      - `id` (uuid, primary key)
      - `user_id` (uuid, references users)
      - `call_id` (uuid, references calls)
      - `minutes_used` (decimal)
      - `cost` (decimal)
      - `engine` (text)
      - `created_at` (timestamp with timezone)
      - `billed` (boolean)
      - `billed_at` (timestamp with timezone)

  2. New View
    - `monthly_ai_usage`: Aggregates monthly usage per user
    
  3. Security
    - Enable RLS
    - Add policies for users to view their own usage
*/

-- Create ai_usage table
CREATE TABLE IF NOT EXISTS ai_usage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) NOT NULL,
  call_id uuid REFERENCES calls(id) NOT NULL,
  minutes_used decimal(10,2) NOT NULL,
  cost decimal(10,2) NOT NULL,
  engine text NOT NULL,
  created_at timestamptz DEFAULT now(),
  billed boolean DEFAULT false,
  billed_at timestamptz
);

-- Enable RLS
ALTER TABLE ai_usage ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own usage"
  ON ai_usage
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Create view for monthly usage
CREATE OR REPLACE VIEW monthly_ai_usage AS
SELECT 
  user_id,
  date_trunc('month', created_at) as month,
  SUM(minutes_used) as total_minutes,
  SUM(cost) as total_cost,
  COUNT(*) as total_calls,
  bool_and(billed) as is_billed
FROM ai_usage
GROUP BY user_id, date_trunc('month', created_at);

-- Add function to calculate AI usage cost
CREATE OR REPLACE FUNCTION calculate_ai_cost(
  minutes decimal,
  engine text
) RETURNS decimal AS $$
BEGIN
  RETURN CASE engine
    WHEN 'gpt4' THEN minutes * 0.03 -- €0.03 per minute
    WHEN 'gpt35' THEN minutes * 0.01 -- €0.01 per minute
    WHEN 'claude' THEN minutes * 0.02 -- €0.02 per minute
    ELSE minutes * 0.03 -- Default to highest rate
  END;
END;
$$ LANGUAGE plpgsql;