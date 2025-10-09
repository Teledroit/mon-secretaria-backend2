/*
  # Database Triggers Setup

  1. New Triggers
    - Call limit enforcement on insert
    - Automatic cost calculation on call completion
    - Transcription processing with sentiment analysis
    - User initialization on signup

  2. Security
    - Secure trigger execution
    - User data isolation
    - Input validation

  3. Automation
    - Real-time cost calculation
    - Automatic sentiment analysis
    - Subscription limit enforcement
*/

-- Drop existing triggers to avoid conflicts
DROP TRIGGER IF EXISTS enforce_call_limits_trigger ON calls;
DROP TRIGGER IF EXISTS calculate_call_cost_trigger ON calls;
DROP TRIGGER IF EXISTS transcription_processing ON transcriptions;
DROP TRIGGER IF EXISTS on_subscription_created ON stripe_subscriptions;

-- Trigger to enforce call limits
CREATE TRIGGER enforce_call_limits_trigger
    BEFORE INSERT ON calls
    FOR EACH ROW
    EXECUTE FUNCTION enforce_call_limits();

-- Trigger to calculate call costs
CREATE TRIGGER calculate_call_cost_trigger
    BEFORE UPDATE ON calls
    FOR EACH ROW
    EXECUTE FUNCTION calculate_call_cost_trigger();

-- Trigger to process transcriptions
CREATE TRIGGER transcription_processing
    BEFORE INSERT ON transcriptions
    FOR EACH ROW
    EXECUTE FUNCTION process_transcription();

-- Function for subscription initialization
CREATE OR REPLACE FUNCTION initialize_subscription()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Log subscription creation
    RAISE NOTICE 'New subscription created: % for customer %', NEW.subscription_id, NEW.customer_id;
    
    -- You could add additional initialization logic here
    -- For example, sending welcome emails, setting up default configurations, etc.
    
    RETURN NEW;
END;
$$;

-- Trigger for subscription initialization
CREATE TRIGGER on_subscription_created
    BEFORE INSERT ON stripe_subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION initialize_subscription();