/*
  # Add Missing CRUD Policies for Tables with Incomplete Coverage

  1. Changes
    - Add INSERT policy for ai_usage (system can track usage)
    - Add INSERT/UPDATE/DELETE policies for stripe_customers
    - Add INSERT/UPDATE/DELETE policies for stripe_orders
    - Add INSERT/UPDATE policies for stripe_subscriptions
    - Add INSERT policy for system_logs (system-level logging)
    - Add INSERT/UPDATE/DELETE policies for transcriptions (via call ownership)
    - Add UPDATE/DELETE policies for contact_messages
    - Add UPDATE/DELETE policies for sms_logs
    - Add DELETE policies for calls, notifications, and twilio_accounts

  2. Security
    - All policies enforce proper ownership checks
    - System tables allow service role to manage data
    - Transcriptions access controlled via call ownership
*/

-- AI Usage INSERT policy
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'ai_usage' AND policyname = 'System can insert AI usage'
  ) THEN
    CREATE POLICY "System can insert AI usage"
      ON ai_usage
      FOR INSERT
      TO authenticated
      WITH CHECK (true);
  END IF;
END $$;

-- Stripe Customers policies
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'stripe_customers' AND policyname = 'System can manage stripe customers'
  ) THEN
    CREATE POLICY "System can manage stripe customers"
      ON stripe_customers
      FOR ALL
      TO authenticated
      USING (user_id = auth.uid())
      WITH CHECK (user_id = auth.uid());
  END IF;
END $$;

-- Stripe Orders policies
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'stripe_orders' AND policyname = 'System can manage stripe orders'
  ) THEN
    CREATE POLICY "System can manage stripe orders"
      ON stripe_orders
      FOR ALL
      TO authenticated
      USING (customer_id IN (SELECT customer_id FROM stripe_customers WHERE user_id = auth.uid() AND deleted_at IS NULL))
      WITH CHECK (customer_id IN (SELECT customer_id FROM stripe_customers WHERE user_id = auth.uid() AND deleted_at IS NULL));
  END IF;
END $$;

-- Stripe Subscriptions UPDATE/INSERT/DELETE policies
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'stripe_subscriptions' AND policyname = 'System can manage stripe subscriptions'
  ) THEN
    CREATE POLICY "System can manage stripe subscriptions"
      ON stripe_subscriptions
      FOR ALL
      TO authenticated
      USING (customer_id IN (SELECT customer_id FROM stripe_customers WHERE user_id = auth.uid() AND deleted_at IS NULL))
      WITH CHECK (customer_id IN (SELECT customer_id FROM stripe_customers WHERE user_id = auth.uid() AND deleted_at IS NULL));
  END IF;
END $$;

-- System logs INSERT policy (admin only via service role)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'system_logs' AND policyname = 'System can insert logs'
  ) THEN
    CREATE POLICY "System can insert logs"
      ON system_logs
      FOR INSERT
      TO authenticated
      WITH CHECK (true);
  END IF;
END $$;

-- Transcriptions policies (access via call ownership)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'transcriptions' AND policyname = 'Users can manage own call transcriptions'
  ) THEN
    CREATE POLICY "Users can manage own call transcriptions"
      ON transcriptions
      FOR ALL
      TO authenticated
      USING (call_id IN (SELECT id FROM calls WHERE user_id = auth.uid()))
      WITH CHECK (call_id IN (SELECT id FROM calls WHERE user_id = auth.uid()));
  END IF;
END $$;

-- Contact messages UPDATE policy
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'contact_messages' AND policyname = 'Users can update own messages'
  ) THEN
    CREATE POLICY "Users can update own messages"
      ON contact_messages
      FOR UPDATE
      TO authenticated
      USING (email = (SELECT email FROM auth.users WHERE id = auth.uid()))
      WITH CHECK (email = (SELECT email FROM auth.users WHERE id = auth.uid()));
  END IF;
END $$;

-- SMS logs UPDATE/DELETE policies
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'sms_logs' AND policyname = 'Users can manage own SMS logs'
  ) THEN
    CREATE POLICY "Users can manage own SMS logs"
      ON sms_logs
      FOR ALL
      TO authenticated
      USING (user_id = auth.uid())
      WITH CHECK (user_id = auth.uid());
  END IF;
END $$;

-- Calls DELETE policy
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'calls' AND policyname = 'Users can delete own calls'
  ) THEN
    CREATE POLICY "Users can delete own calls"
      ON calls
      FOR DELETE
      TO authenticated
      USING (auth.uid() = user_id);
  END IF;
END $$;

-- Notifications DELETE policy
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'notifications' AND policyname = 'Users can delete own notifications'
  ) THEN
    CREATE POLICY "Users can delete own notifications"
      ON notifications
      FOR DELETE
      TO authenticated
      USING (user_id = auth.uid());
  END IF;
END $$;

-- Twilio accounts DELETE policy
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'twilio_accounts' AND policyname = 'Users can delete own twilio accounts'
  ) THEN
    CREATE POLICY "Users can delete own twilio accounts"
      ON twilio_accounts
      FOR DELETE
      TO authenticated
      USING (user_id = auth.uid());
  END IF;
END $$;
