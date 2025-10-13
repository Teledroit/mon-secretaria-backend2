/*
  # Schéma initial pour MonSecretarIA

  1. Nouvelles Tables
    - `users` : Stockage des utilisateurs et leurs préférences
    - `calls` : Historique des appels
    - `transcriptions` : Transcriptions des conversations
    - `configurations` : Configurations des assistants par utilisateur

  2. Sécurité
    - RLS activé sur toutes les tables
    - Politiques d'accès basées sur l'authentification
*/

-- Création de la table users
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT auth.uid(),
  email text UNIQUE NOT NULL,
  full_name text,
  company_name text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Création de la table calls
CREATE TABLE IF NOT EXISTS calls (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) NOT NULL,
  start_time timestamptz NOT NULL,
  end_time timestamptz,
  duration interval,
  phone_number text NOT NULL,
  status text NOT NULL,
  cost decimal(10,2),
  created_at timestamptz DEFAULT now()
);

-- Création de la table transcriptions
CREATE TABLE IF NOT EXISTS transcriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  call_id uuid REFERENCES calls(id) NOT NULL,
  timestamp timestamptz NOT NULL,
  speaker text NOT NULL,
  content text NOT NULL,
  sentiment text,
  created_at timestamptz DEFAULT now()
);

-- Création de la table configurations
CREATE TABLE IF NOT EXISTS configurations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) NOT NULL,
  tts_engine text NOT NULL,
  nlp_engine text NOT NULL,
  voice_id text NOT NULL,
  temperature decimal(3,2) NOT NULL,
  system_instructions text,
  welcome_message text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Activation de RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE calls ENABLE ROW LEVEL SECURITY;
ALTER TABLE transcriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE configurations ENABLE ROW LEVEL SECURITY;

-- Politiques de sécurité pour users
CREATE POLICY "Users can read own data" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own data" ON users
  FOR UPDATE USING (auth.uid() = id);

-- Politiques de sécurité pour calls
CREATE POLICY "Users can read own calls" ON calls
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own calls" ON calls
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Politiques de sécurité pour transcriptions
CREATE POLICY "Users can read own transcriptions" ON transcriptions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM calls
      WHERE calls.id = transcriptions.call_id
      AND calls.user_id = auth.uid()
    )
  );

-- Politiques de sécurité pour configurations
CREATE POLICY "Users can read own configurations" ON configurations
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own configurations" ON configurations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own configurations" ON configurations
  FOR UPDATE USING (auth.uid() = user_id);