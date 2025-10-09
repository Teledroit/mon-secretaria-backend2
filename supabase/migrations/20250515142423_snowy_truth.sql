/*
  # Add Newsletter Subscriptions

  1. New Table
    - `newsletter_subscriptions`: Stores newsletter subscriber emails
      - `id` (uuid, primary key)
      - `email` (text, unique, required)
      - `subscribed_at` (timestamp with timezone)
      - `unsubscribed_at` (timestamp with timezone, nullable)
      - `status` (enum: active, unsubscribed)

  2. Security
    - Enable RLS
    - Allow anonymous inserts
    - Allow admins to view all subscriptions
*/

-- Create newsletter subscription status enum
CREATE TYPE newsletter_status AS ENUM ('active', 'unsubscribed');

-- Create newsletter_subscriptions table
CREATE TABLE IF NOT EXISTS newsletter_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  subscribed_at timestamptz DEFAULT now(),
  unsubscribed_at timestamptz,
  status newsletter_status DEFAULT 'active',
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE newsletter_subscriptions ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Enable insert access for anonymous users" ON newsletter_subscriptions
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Enable admin read access" ON newsletter_subscriptions
  FOR SELECT
  TO authenticated
  USING (auth.uid() IN (
    SELECT id FROM users WHERE email = 'contact.monsecretaria@gmail.com'
  ));