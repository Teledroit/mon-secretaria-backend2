/*
  # Create GDPR Requests Table

  1. New Tables
    - `gdpr_requests`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to users)
      - `request_type` (text: 'export' or 'deletion')
      - `status` (text: 'pending', 'processing', 'completed', 'failed')
      - `requested_at` (timestamptz)
      - `completed_at` (timestamptz, nullable)
      - `notes` (text, nullable)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `gdpr_requests` table
    - Add policy for users to view their own GDPR requests
    - Add policy for users to create their own GDPR requests
    - Add policy for admin to view all GDPR requests
*/

CREATE TABLE IF NOT EXISTS gdpr_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  request_type text NOT NULL CHECK (request_type IN ('export', 'deletion')),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  requested_at timestamptz DEFAULT now(),
  completed_at timestamptz,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_gdpr_requests_user_id ON gdpr_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_gdpr_requests_status ON gdpr_requests(status);
CREATE INDEX IF NOT EXISTS idx_gdpr_requests_type ON gdpr_requests(request_type);

ALTER TABLE gdpr_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own GDPR requests"
  ON gdpr_requests
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own GDPR requests"
  ON gdpr_requests
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own GDPR requests"
  ON gdpr_requests
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
