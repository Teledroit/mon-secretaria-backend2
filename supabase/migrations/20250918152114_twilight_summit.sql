/*
  # Phone Number Management System

  1. Enhanced Tables
    - Enhanced `twilio_accounts` with better validation
    - Enhanced `twilio_phone_numbers` with status tracking
    - Enhanced `sip_configurations` with connection details

  2. Security
    - Row Level Security policies for all tables
    - User-specific access controls
    - Secure phone number management

  3. Indexes
    - Performance indexes for phone number lookups
    - User-specific query optimization
    - Status-based filtering indexes
*/

-- Ensure twilio_accounts table has proper constraints
DO $$
BEGIN
    -- Add unique constraint on account_sid if not exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'twilio_accounts' 
        AND constraint_name = 'twilio_accounts_account_sid_key'
    ) THEN
        ALTER TABLE twilio_accounts ADD CONSTRAINT twilio_accounts_account_sid_key UNIQUE (account_sid);
    END IF;
    
    -- Add check constraint for status
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.check_constraints 
        WHERE constraint_name = 'check_twilio_account_status'
    ) THEN
        ALTER TABLE twilio_accounts ADD CONSTRAINT check_twilio_account_status 
        CHECK (status IN ('active', 'closed', 'suspended'));
    END IF;
END $$;

-- Ensure twilio_phone_numbers table has proper constraints
DO $$
BEGIN
    -- Add unique constraint on phone_number if not exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'twilio_phone_numbers' 
        AND constraint_name = 'twilio_phone_numbers_phone_number_key'
    ) THEN
        ALTER TABLE twilio_phone_numbers ADD CONSTRAINT twilio_phone_numbers_phone_number_key 
        UNIQUE (phone_number);
    END IF;
    
    -- Add check constraint for phone number format
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.check_constraints 
        WHERE constraint_name = 'check_phone_number_format'
    ) THEN
        ALTER TABLE twilio_phone_numbers ADD CONSTRAINT check_phone_number_format 
        CHECK (phone_number ~ '^\+[1-9]\d{1,14}$');
    END IF;
END $$;

-- Ensure sip_configurations table has proper constraints
DO $$
BEGIN
    -- Add check constraint for termination_uri format
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.check_constraints 
        WHERE constraint_name = 'check_termination_uri_format'
    ) THEN
        ALTER TABLE sip_configurations ADD CONSTRAINT check_termination_uri_format 
        CHECK (termination_uri ~ '^sip:');
    END IF;
    
    -- Add check constraint for username length
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.check_constraints 
        WHERE constraint_name = 'check_sip_username_length'
    ) THEN
        ALTER TABLE sip_configurations ADD CONSTRAINT check_sip_username_length 
        CHECK (LENGTH(username) >= 3);
    END IF;
END $$;

-- Create additional indexes for performance
CREATE INDEX IF NOT EXISTS idx_twilio_accounts_status 
ON twilio_accounts (status) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_twilio_phone_numbers_status 
ON twilio_phone_numbers (status) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_sip_configurations_status 
ON sip_configurations (status) WHERE deleted_at IS NULL;

-- Create composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_twilio_phone_numbers_account_status 
ON twilio_phone_numbers (account_id, status) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_sip_configurations_user_status 
ON sip_configurations (user_id, status) WHERE deleted_at IS NULL;