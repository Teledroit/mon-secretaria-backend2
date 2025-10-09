/*
  # Add Calendly configuration fields

  1. Changes
    - Add calendly_url and calendly_enabled columns to configurations table
    - Set default value for calendly_enabled to false

  2. Security
    - Existing RLS policies will handle access control
*/

ALTER TABLE configurations
ADD COLUMN IF NOT EXISTS calendly_url text,
ADD COLUMN IF NOT EXISTS calendly_enabled boolean DEFAULT false;