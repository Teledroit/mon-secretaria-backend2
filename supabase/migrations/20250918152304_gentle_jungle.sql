/*
  # Database Triggers Setup

  1. Triggers
    - Call limits enforcement
    - Transcription processing
    - Configuration validation
    - Automatic cost calculation

  2. Features
    - Automatic data validation
    - Real-time processing
    - Cost calculation on call completion
    - Sentiment analysis integration

  3. Security
    - Secure trigger execution
    - Data integrity enforcement
    - Audit trail maintenance
*/

-- Ensure all triggers are properly created

-- Trigger for call limits enforcement
DROP TRIGGER IF EXISTS enforce_call_limits_trigger ON calls;
CREATE TRIGGER enforce_call_limits_trigger
    BEFORE INSERT ON calls
    FOR EACH ROW
    EXECUTE FUNCTION enforce_call_limits();

-- Trigger for transcription processing
DROP TRIGGER IF EXISTS transcription_processing ON transcriptions;
CREATE TRIGGER transcription_processing
    BEFORE INSERT ON transcriptions
    FOR EACH ROW
    EXECUTE FUNCTION process_transcription();

-- Trigger for configuration validation
DROP TRIGGER IF EXISTS validate_configuration_settings_trigger ON configurations;
CREATE TRIGGER validate_configuration_settings_trigger
    BEFORE INSERT OR UPDATE ON configurations
    FOR EACH ROW
    EXECUTE FUNCTION validate_configuration_settings();

-- Trigger for automatic cost calculation on call completion
CREATE OR REPLACE FUNCTION calculate_call_cost_trigger()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    duration_seconds INTEGER;
    user_config RECORD;
    calculated_cost NUMERIC;
BEGIN
    -- Only calculate cost when call is completed
    IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
        -- Calculate duration in seconds
        IF NEW.end_time IS NOT NULL AND NEW.start_time IS NOT NULL THEN
            duration_seconds := EXTRACT(EPOCH FROM (NEW.end_time - NEW.start_time));
            
            -- Get user's AI engine configuration
            SELECT nlp_engine INTO user_config
            FROM configurations
            WHERE user_id = NEW.user_id;
            
            -- Calculate cost
            calculated_cost := calculate_call_cost(
                duration_seconds,
                COALESCE(user_config.nlp_engine, 'gpt4')
            );
            
            -- Update the call record
            NEW.cost := calculated_cost;
            
            -- Log AI usage
            INSERT INTO ai_usage (
                user_id,
                call_id,
                minutes_used,
                cost,
                engine,
                created_at
            ) VALUES (
                NEW.user_id,
                NEW.id,
                CEIL(duration_seconds / 60.0),
                calculated_cost,
                COALESCE(user_config.nlp_engine, 'gpt4'),
                NOW()
            );
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS calculate_call_cost_trigger ON calls;
CREATE TRIGGER calculate_call_cost_trigger
    BEFORE UPDATE ON calls
    FOR EACH ROW
    EXECUTE FUNCTION calculate_call_cost_trigger();

-- Trigger for subscription initialization
CREATE OR REPLACE FUNCTION initialize_subscription()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    user_uuid UUID;
BEGIN
    -- Get user ID from customer
    SELECT user_id INTO user_uuid
    FROM stripe_customers
    WHERE customer_id = NEW.customer_id AND deleted_at IS NULL;
    
    -- Create default configuration if user exists and doesn't have one
    IF user_uuid IS NOT NULL THEN
        INSERT INTO configurations (
            user_id,
            tts_engine,
            nlp_engine,
            voice_id,
            temperature,
            welcome_message,
            created_at,
            updated_at
        ) VALUES (
            user_uuid,
            'elevenlabs',
            'gpt4',
            'EXAVITQu4vr4xnSDxMaL',
            0.7,
            'Bonjour, vous êtes en communication avec l''assistant virtuel du cabinet. Comment puis-je vous aider ?',
            NOW(),
            NOW()
        )
        ON CONFLICT (user_id) DO NOTHING;
    END IF;
    
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_subscription_created ON stripe_subscriptions;
CREATE TRIGGER on_subscription_created
    BEFORE INSERT ON stripe_subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION initialize_subscription();