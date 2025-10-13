/*
  # Update AI Cost Calculation

  1. Changes
    - Double the per-minute rates for all AI engines
    - Update function to include margin for profitability
    - Maintain existing function signature for compatibility

  2. Cost Updates
    - GPT-4: €0.03 -> €0.06 per minute
    - GPT-3.5: €0.01 -> €0.02 per minute
    - Claude: €0.02 -> €0.04 per minute
*/

-- Drop existing function
DROP FUNCTION IF EXISTS calculate_ai_cost;

-- Create updated function with doubled rates
CREATE OR REPLACE FUNCTION calculate_ai_cost(
  minutes decimal,
  engine text
) RETURNS decimal AS $$
BEGIN
  RETURN CASE engine
    WHEN 'gpt4' THEN minutes * 0.06 -- €0.06 per minute (doubled from €0.03)
    WHEN 'gpt35' THEN minutes * 0.02 -- €0.02 per minute (doubled from €0.01)
    WHEN 'claude' THEN minutes * 0.04 -- €0.04 per minute (doubled from €0.02)
    ELSE minutes * 0.06 -- Default to highest rate (doubled from €0.03)
  END;
END;
$$ LANGUAGE plpgsql;