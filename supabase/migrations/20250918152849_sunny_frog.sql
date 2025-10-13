/*
  # Database Triggers Setup

  1. Call Management Triggers
    - Enforce call limits before insert
    - Calculate costs after call completion
    - Process transcriptions with AI analysis

  2. User Management Triggers
    - Initialize new user configurations
    - Handle subscription changes

  3. Security Triggers
    - Validate configuration settings
    - Audit sensitive operations
*/

-- Create trigger for call limits enforcement
DROP TRIGGER IF EXISTS enforce_call_limits_trigger ON calls;
CREATE TRIGGER enforce_call_limits_trigger
  BEFORE INSERT ON calls
  FOR EACH ROW
  EXECUTE FUNCTION enforce_call_limits();

-- Create trigger for transcription processing
DROP TRIGGER IF EXISTS transcription_processing ON transcriptions;
CREATE TRIGGER transcription_processing
  BEFORE INSERT ON transcriptions
  FOR EACH ROW
  EXECUTE FUNCTION process_transcription();

-- Create trigger for new user initialization
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- Create trigger for subscription initialization
DROP TRIGGER IF EXISTS on_subscription_created ON stripe_subscriptions;
CREATE TRIGGER on_subscription_created
  BEFORE INSERT ON stripe_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION initialize_subscription();

-- Create trigger for configuration validation
DROP TRIGGER IF EXISTS validate_configuration_settings_trigger ON configurations;
CREATE TRIGGER validate_configuration_settings_trigger
  BEFORE INSERT OR UPDATE ON configurations
  FOR EACH ROW
  EXECUTE FUNCTION validate_configuration_settings();