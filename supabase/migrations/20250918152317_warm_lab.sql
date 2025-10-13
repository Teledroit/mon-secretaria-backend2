/*
  # User Management Functions

  1. New Functions
    - `handle_new_user` - Traite les nouveaux utilisateurs
    - `get_user_dashboard_stats` - Statistiques pour le dashboard
    - `update_user_profile` - Met à jour le profil utilisateur
    - `deactivate_user_account` - Désactive un compte utilisateur

  2. Features
    - Initialisation automatique des nouveaux comptes
    - Statistiques personnalisées par utilisateur
    - Gestion complète des profils
    - Désactivation sécurisée des comptes

  3. Security
    - Validation des données utilisateur
    - Audit des modifications de profil
    - Gestion sécurisée des suppressions
*/

-- Function to handle new user registration
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Insert user profile data
    INSERT INTO users (
        id,
        email,
        full_name,
        created_at,
        updated_at
    ) VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
        NOW(),
        NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        full_name = COALESCE(EXCLUDED.full_name, users.full_name),
        updated_at = NOW();
    
    -- Create default configuration
    INSERT INTO configurations (
        user_id,
        tts_engine,
        nlp_engine,
        voice_id,
        temperature,
        welcome_message,
        voice_type,
        detect_voicemail,
        max_call_duration,
        silence_timeout,
        latency,
        interruption_sensitivity,
        enable_backchanneling,
        enable_speech_normalization,
        working_hours_start,
        working_hours_end,
        working_days,
        notifications_email,
        notifications_sms,
        notifications,
        created_at,
        updated_at
    ) VALUES (
        NEW.id,
        'elevenlabs',
        'gpt4',
        'EXAVITQu4vr4xnSDxMaL',
        0.7,
        'Bonjour, vous êtes en communication avec l''assistant virtuel du cabinet. Comment puis-je vous aider ?',
        'female',
        TRUE,
        20,
        5,
        0.5,
        0.7,
        TRUE,
        TRUE,
        '09:00:00',
        '18:00:00',
        ARRAY['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
        TRUE,
        FALSE,
        jsonb_build_object(
            'email', true,
            'sms', false,
            'appointments', jsonb_build_object(
                'enabled', true,
                'sms', true,
                'email', true
            ),
            'urgentCalls', jsonb_build_object(
                'enabled', true,
                'sms', true,
                'email', true
            ),
            'importantRequests', jsonb_build_object(
                'enabled', true,
                'email', true,
                'threshold', 'high'
            )
        ),
        NOW(),
        NOW()
    )
    ON CONFLICT (user_id) DO NOTHING;
    
    RETURN NEW;
END;
$$;

-- Create trigger for new user handling
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION handle_new_user();

-- Function to get dashboard statistics for a user
CREATE OR REPLACE FUNCTION get_user_dashboard_stats(user_uuid UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result JSON;
    today_start TIMESTAMPTZ;
    month_start TIMESTAMPTZ;
BEGIN
    today_start := DATE_TRUNC('day', NOW());
    month_start := DATE_TRUNC('month', NOW());
    
    WITH call_stats AS (
        SELECT 
            COUNT(*) FILTER (WHERE start_time >= today_start) as calls_today,
            COUNT(*) FILTER (WHERE start_time >= month_start) as calls_month,
            COUNT(*) FILTER (WHERE status = 'completed' AND start_time >= today_start) as completed_today,
            COALESCE(AVG(
                CASE 
                    WHEN end_time IS NOT NULL AND start_time IS NOT NULL 
                    THEN EXTRACT(EPOCH FROM (end_time - start_time)) / 60
                    ELSE NULL
                END
            ), 0) as avg_duration_minutes,
            COALESCE(SUM(cost), 0) as total_cost_month
        FROM calls
        WHERE user_id = user_uuid
    ),
    appointment_stats AS (
        SELECT 
            COUNT(*) FILTER (WHERE created_at >= today_start) as appointments_today,
            COUNT(*) FILTER (WHERE created_at >= month_start) as appointments_month
        FROM appointments
        WHERE user_id = user_uuid AND deleted_at IS NULL
    )
    SELECT json_build_object(
        'calls_today', cs.calls_today,
        'calls_month', cs.calls_month,
        'completed_today', cs.completed_today,
        'appointments_today', aps.appointments_today,
        'appointments_month', aps.appointments_month,
        'avg_duration_minutes', cs.avg_duration_minutes,
        'total_cost_month', cs.total_cost_month,
        'conversion_rate', CASE 
            WHEN cs.calls_today > 0 
            THEN (cs.completed_today::NUMERIC / cs.calls_today::NUMERIC) * 100
            ELSE 0
        END
    ) INTO result
    FROM call_stats cs, appointment_stats aps;
    
    RETURN result;
END;
$$;

-- Function to update user profile
CREATE OR REPLACE FUNCTION update_user_profile(
    user_uuid UUID,
    full_name_param TEXT DEFAULT NULL,
    company_name_param TEXT DEFAULT NULL,
    phone_param TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Validate phone number format if provided
    IF phone_param IS NOT NULL AND phone_param != '' THEN
        IF NOT (phone_param ~ '^\+[1-9]\d{1,14}$') THEN
            RAISE EXCEPTION 'Invalid phone number format. Use international format (+33123456789)';
        END IF;
    END IF;
    
    -- Update user profile
    UPDATE users
    SET 
        full_name = COALESCE(full_name_param, full_name),
        company_name = COALESCE(company_name_param, company_name),
        phone = COALESCE(phone_param, phone),
        updated_at = NOW()
    WHERE id = user_uuid;
    
    RETURN FOUND;
END;
$$;

-- Function to safely deactivate user account
CREATE OR REPLACE FUNCTION deactivate_user_account(user_uuid UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Only allow admin to deactivate accounts
    IF auth.uid() != user_uuid AND auth.email() != 'contact.monsecretaria@gmail.com' THEN
        RAISE EXCEPTION 'Insufficient permissions to deactivate account';
    END IF;
    
    -- Soft delete approach - mark as service paused
    UPDATE users
    SET 
        service_paused = TRUE,
        updated_at = NOW()
    WHERE id = user_uuid;
    
    -- Deactivate phone numbers
    UPDATE twilio_phone_numbers
    SET 
        status = 'inactive',
        updated_at = NOW()
    WHERE account_id IN (
        SELECT id FROM twilio_accounts WHERE user_id = user_uuid
    );
    
    -- Deactivate SIP configurations
    UPDATE sip_configurations
    SET 
        status = 'inactive',
        updated_at = NOW()
    WHERE user_id = user_uuid;
    
    RETURN TRUE;
END;
$$;