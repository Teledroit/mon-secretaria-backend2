/*
  # Add Service Pause Configuration

  1. Changes
    - Add service_paused column to configurations table
    - Add working_days array column to configurations table
    - Set default values for new columns

  2. Security
    - Existing RLS policies will handle access control
*/

-- Add service pause column
ALTER TABLE configurations
ADD COLUMN IF NOT EXISTS service_paused boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS working_days text[] DEFAULT ARRAY['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];