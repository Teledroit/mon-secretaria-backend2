/*
  # Create SMS logs table

  1. New Tables
    - `sms_logs`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to users)
      - `phone_number` (text)
      - `message` (text)
      - `twilio_sid` (text, Twilio message SID)
      - `status` (text, delivery status)
      - `notification_type` (text, type of notification)
      - `sent_at` (timestamp)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on `sms_logs` table
    - Add policy for users to read their own SMS logs
*/

CREATE TABLE IF NOT EXISTS sms_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) NOT NULL,
  phone_number text NOT NULL,
  message text NOT NULL,
  twilio_sid text,
  status text,
  notification_type text,
  sent_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE sms_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own SMS logs"
  ON sms_logs
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert SMS logs"
  ON sms_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_sms_logs_user_id_sent_at 
  ON sms_logs(user_id, sent_at DESC);