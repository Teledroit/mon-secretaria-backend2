/*
  # Call Management Functions

  1. New Functions
    - `enforce_call_limits` - Vérifie les limites d'appels par plan
    - `calculate_call_cost` - Calcule le coût d'un appel
    - `process_transcription` - Traite les transcriptions avec IA
    - `validate_configuration_settings` - Valide les paramètres de configuration

  2. Features
    - Gestion automatique des limites d'appels
    - Calcul des coûts en temps réel
    - Traitement intelligent des transcriptions
    - Validation des configurations

  3. Security
    - Vérification des quotas utilisateur
    - Validation des données d'entrée
    - Audit des modifications
*/

-- Function to enforce call limits based on subscription
CREATE OR REPLACE FUNCTION enforce_call_limits()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    user_subscription RECORD;
    current_month_calls INTEGER;
    call_limit INTEGER;
BEGIN
    -- Get user's subscription details
    SELECT 
        ss.price_id,
        ss.status
    INTO user_subscription
    FROM stripe_subscriptions ss
    JOIN stripe_customers sc ON ss.customer_id = sc.customer_id
    WHERE sc.user_id = NEW.user_id
    AND ss.deleted_at IS NULL
    AND sc.deleted_at IS NULL;
    
    -- Determine call limit based on price_id
    IF user_subscription.price_id = 'price_1RQ8ZxHCmF7qRHmmpTKP7VFi' THEN
        call_limit := 49; -- Starter plan
    ELSE
        call_limit := NULL; -- Unlimited for other plans
    END IF;
    
    -- Check if limit applies
    IF call_limit IS NOT NULL THEN
        -- Count calls this month
        SELECT COUNT(*)
        INTO current_month_calls
        FROM calls
        WHERE user_id = NEW.user_id
        AND start_time >= DATE_TRUNC('month', CURRENT_DATE);
        
        -- Enforce limit
        IF current_month_calls >= call_limit THEN
            RAISE EXCEPTION 'Monthly call limit exceeded. Upgrade your plan for unlimited calls.';
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$;

-- Function to calculate call cost
CREATE OR REPLACE FUNCTION calculate_call_cost(
    call_duration_seconds INTEGER,
    ai_engine TEXT DEFAULT 'gpt4'
)
RETURNS NUMERIC
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
    cost_per_minute NUMERIC;
    duration_minutes NUMERIC;
BEGIN
    -- Convert seconds to minutes (round up)
    duration_minutes := CEIL(call_duration_seconds / 60.0);
    
    -- Set cost per minute based on AI engine
    CASE ai_engine
        WHEN 'gpt4' THEN cost_per_minute := 0.06;
        WHEN 'gpt35' THEN cost_per_minute := 0.02;
        WHEN 'claude' THEN cost_per_minute := 0.04;
        ELSE cost_per_minute := 0.06; -- Default to GPT-4 pricing
    END CASE;
    
    RETURN duration_minutes * cost_per_minute;
END;
$$;

-- Function to process transcriptions with sentiment analysis
CREATE OR REPLACE FUNCTION process_transcription()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    sentiment_score NUMERIC;
    appointment_keywords TEXT[] := ARRAY['rendez-vous', 'rdv', 'appointment', 'consultation'];
    urgent_keywords TEXT[] := ARRAY['urgent', 'urgence', 'emergency', 'immédiat'];
    detected_type TEXT;
BEGIN
    -- Simple sentiment analysis based on keywords
    IF NEW.content ~* '(merci|parfait|excellent|satisfait|content)' THEN
        NEW.sentiment := 'positive';
    ELSIF NEW.content ~* '(problème|erreur|mécontent|insatisfait|mauvais)' THEN
        NEW.sentiment := 'negative';
    ELSE
        NEW.sentiment := 'neutral';
    END IF;
    
    -- Detect appointment type based on content
    IF NEW.content ~* ANY(appointment_keywords) THEN
        detected_type := 'appointment_request';
    ELSIF NEW.content ~* ANY(urgent_keywords) THEN
        detected_type := 'urgent_request';
    ELSE
        detected_type := 'general_inquiry';
    END IF;
    
    NEW.appointment_type := detected_type;
    
    -- Generate summary for long transcriptions
    IF LENGTH(NEW.content) > 500 THEN
        NEW.sentiment_summary := LEFT(NEW.content, 200) || '...';
    ELSE
        NEW.sentiment_summary := NEW.content;
    END IF;
    
    RETURN NEW;
END;
$$;

-- Function to validate configuration settings
CREATE OR REPLACE FUNCTION validate_configuration_settings()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    -- Validate working hours
    IF NEW.working_hours_start IS NOT NULL AND NEW.working_hours_end IS NOT NULL THEN
        IF NEW.working_hours_start >= NEW.working_hours_end THEN
            RAISE EXCEPTION 'Working hours start must be before end time';
        END IF;
    END IF;
    
    -- Validate transfer number format if provided
    IF NEW.transfer_number IS NOT NULL AND NEW.transfer_number != '' THEN
        IF NOT (NEW.transfer_number ~ '^\+[1-9]\d{1,14}$') THEN
            RAISE EXCEPTION 'Invalid transfer number format. Use international format (+33123456789)';
        END IF;
    END IF;
    
    -- Validate voice_id for ElevenLabs
    IF NEW.tts_engine = 'elevenlabs' AND (NEW.voice_id IS NULL OR NEW.voice_id = '') THEN
        NEW.voice_id := 'EXAVITQu4vr4xnSDxMaL'; -- Default female voice
    END IF;
    
    -- Validate notifications JSON structure
    IF NEW.notifications IS NOT NULL THEN
        -- Ensure basic structure exists
        IF NOT (NEW.notifications ? 'email' AND NEW.notifications ? 'sms') THEN
            NEW.notifications := NEW.notifications || jsonb_build_object(
                'email', true,
                'sms', false
            );
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$;

-- Function to get user call statistics
CREATE OR REPLACE FUNCTION get_user_call_stats(
    user_uuid UUID,
    period_days INTEGER DEFAULT 30
)
RETURNS TABLE(
    total_calls INTEGER,
    completed_calls INTEGER,
    failed_calls INTEGER,
    total_duration INTERVAL,
    average_duration INTERVAL,
    total_cost NUMERIC,
    conversion_rate NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    start_date TIMESTAMPTZ;
BEGIN
    start_date := NOW() - (period_days || ' days')::INTERVAL;
    
    RETURN QUERY
    SELECT 
        COUNT(*)::INTEGER as total_calls,
        COUNT(*) FILTER (WHERE c.status = 'completed')::INTEGER as completed_calls,
        COUNT(*) FILTER (WHERE c.status = 'failed')::INTEGER as failed_calls,
        COALESCE(SUM(
            CASE 
                WHEN c.end_time IS NOT NULL AND c.start_time IS NOT NULL 
                THEN c.end_time - c.start_time 
                ELSE INTERVAL '0'
            END
        ), INTERVAL '0') as total_duration,
        COALESCE(AVG(
            CASE 
                WHEN c.end_time IS NOT NULL AND c.start_time IS NOT NULL 
                THEN c.end_time - c.start_time 
                ELSE NULL
            END
        ), INTERVAL '0') as average_duration,
        COALESCE(SUM(c.cost), 0) as total_cost,
        CASE 
            WHEN COUNT(*) > 0 
            THEN (COUNT(*) FILTER (WHERE c.status = 'completed')::NUMERIC / COUNT(*)::NUMERIC) * 100
            ELSE 0
        END as conversion_rate
    FROM calls c
    WHERE c.user_id = user_uuid
    AND c.start_time >= start_date;
END;
$$;

-- Function to cleanup old call data
CREATE OR REPLACE FUNCTION cleanup_old_calls(retention_days INTEGER DEFAULT 90)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    deleted_count INTEGER;
    cutoff_date TIMESTAMPTZ;
BEGIN
    cutoff_date := NOW() - (retention_days || ' days')::INTERVAL;
    
    -- Delete old transcriptions first (due to foreign key)
    DELETE FROM transcriptions
    WHERE call_id IN (
        SELECT id FROM calls 
        WHERE start_time < cutoff_date
    );
    
    -- Delete old AI usage records
    DELETE FROM ai_usage
    WHERE call_id IN (
        SELECT id FROM calls 
        WHERE start_time < cutoff_date
    );
    
    -- Delete old calls
    DELETE FROM calls
    WHERE start_time < cutoff_date;
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    RETURN deleted_count;
END;
$$;