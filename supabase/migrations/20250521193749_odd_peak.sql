/*
  # Add appointments table

  1. New Table
    - `appointments`: Stores appointment information
      - `id` (uuid, primary key)
      - `user_id` (uuid, references users)
      - `client_name` (text)
      - `start_time` (timestamptz)
      - `end_time` (timestamptz)
      - `type` (text)
      - `status` (text)
      - `source` (text)
      - Timestamps and soft delete

  2. Security
    - Enable RLS
    - Add policies for users to manage their own appointments
*/

-- Create appointments table
CREATE TABLE IF NOT EXISTS appointments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) NOT NULL,
  client_name text NOT NULL,
  start_time timestamptz NOT NULL,
  end_time timestamptz NOT NULL,
  type text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  source text NOT NULL DEFAULT 'calendly',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  deleted_at timestamptz
);

-- Enable RLS
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own appointments"
  ON appointments
  FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
    AND deleted_at IS NULL
  );

CREATE POLICY "Users can create their own appointments"
  ON appointments
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own appointments"
  ON appointments
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own appointments"
  ON appointments
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Add indexes for better query performance
CREATE INDEX idx_appointments_user_id_start_time 
ON appointments(user_id, start_time) 
WHERE deleted_at IS NULL;

CREATE INDEX idx_appointments_status 
ON appointments(status) 
WHERE deleted_at IS NULL;