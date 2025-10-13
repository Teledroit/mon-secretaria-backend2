/*
  # Fix Missing UPDATE Policy on Notifications Table

  1. Changes
    - Add UPDATE policy for notifications table to allow users to update their own notifications
    - Critical for marking notifications as read/unread

  2. Security
    - Users can only update their own notifications (user_id = auth.uid())
    - Policy ensures data isolation between users
*/

-- Drop policy if it exists and recreate
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'notifications' 
      AND policyname = 'Users can update own notifications'
  ) THEN
    DROP POLICY "Users can update own notifications" ON notifications;
  END IF;
END $$;

-- Add UPDATE policy for notifications table
CREATE POLICY "Users can update own notifications"
  ON notifications
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
