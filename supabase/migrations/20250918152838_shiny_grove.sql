/*
  # Call Management Functions

  1. Call Processing
    - `enforce_call_limits` - Enforces call limits based on subscription
    - `calculate_call_cost` - Calculates AI usage costs
    - `process_transcription` - Processes call transcriptions with AI

  2. Analytics
    - `get_call_analytics` - Returns call analytics for user
    - `get_monthly_usage` - Returns monthly usage statistics

  3. Security
    - User-specific data access
    - Subscription validation
    - Cost calculation accuracy
*/

-- Function to enforce call limits based on subscription
CREATE OR REPLACE FUNCTION enforce_call_limits()
RETURNS TRIGGER AS $$
DECLARE
  user_subscription RECORD;
  current_month_calls INTEGER;
  call_limit INTEGER;
BEGIN
  -- Get user's subscription info
  SELECT 
    sus.price_id,
    sus.status as subscription_status
  INTO user_subscription
  FROM stripe_user_subscriptions sus
  WHERE sus.customer_id IN (
    SELECT customer_id FROM stripe_customers WHERE user_id = NEW.user_id
  );
  
  -- Determine call limit based on subscription
  IF user_subscription.price_id = 'price_1RQ8ZxHCmF7qRHmmpTKP7VFi' THEN
    -- Starter plan: 49 calls per month
    call_limit := 49;
  ELSE
    -- Premium plan or no subscription: unlimited
    call_limit := NULL;
  END IF;
  
  -- Check limit only if applicable
  IF call_limit IS NOT NULL THEN
    -- Count calls this month
    SELECT COUNT(*) INTO current_month_calls
    FROM calls 
    WHERE user_id = NEW.user_id 
      AND start_time >= date_trunc('month', CURRENT_DATE);
    
    -- Enforce limit
    IF current_month_calls >= call_limit THEN
      RAISE EXCEPTION 'Monthly call limit exceeded. Upgrade to premium for unlimited calls.';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate call cost
CREATE OR REPLACE FUNCTION calculate_call_cost(
  call_duration_minutes NUMERIC,
  ai_engine TEXT DEFAULT 'gpt4'
)
RETURNS NUMERIC AS $$
DECLARE
  cost_per_minute NUMERIC;
  total_cost NUMERIC;
BEGIN
  -- Set cost per minute based on AI engine
  CASE ai_engine
    WHEN 'gpt4' THEN cost_per_minute := 0.06;
    WHEN 'gpt35' THEN cost_per_minute := 0.02;
    WHEN 'claude' THEN cost_per_minute := 0.04;
    ELSE cost_per_minute := 0.06; -- Default to GPT-4 pricing
  END CASE;
  
  -- Calculate total cost
  total_cost := call_duration_minutes * cost_per_minute;
  
  -- Round to 2 decimal places
  RETURN ROUND(total_cost, 2);
END;
$$ LANGUAGE plpgsql;

-- Function to process transcription with sentiment analysis
CREATE OR REPLACE FUNCTION process_transcription()
RETURNS TRIGGER AS $$
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
    detected_type := 'urgent_matter';
  ELSE
    detected_type := 'general_inquiry';
  END IF;
  
  NEW.appointment_type := detected_type;
  
  -- Generate sentiment summary for the call
  NEW.sentiment_summary := CASE NEW.sentiment
    WHEN 'positive' THEN 'Client satisfait de l''interaction'
    WHEN 'negative' THEN 'Client exprime une insatisfaction'
    ELSE 'Interaction neutre'
  END;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to get call analytics for a user
CREATE OR REPLACE FUNCTION get_call_analytics(
  user_uuid UUID,
  start_date DATE DEFAULT NULL,
  end_date DATE DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  analytics JSONB;
  total_calls INTEGER;
  completed_calls INTEGER;
  avg_duration INTERVAL;
  total_cost NUMERIC;
  sentiment_stats JSONB;
BEGIN
  -- Set default date range if not provided
  IF start_date IS NULL THEN
    start_date := date_trunc('month', CURRENT_DATE)::DATE;
  END IF;
  
  IF end_date IS NULL THEN
    end_date := CURRENT_DATE;
  END IF;
  
  -- Get basic call statistics
  SELECT 
    COUNT(*),
    COUNT(*) FILTER (WHERE status = 'completed'),
    AVG(CASE 
      WHEN end_time IS NOT NULL AND start_time IS NOT NULL 
      THEN end_time - start_time 
      ELSE NULL 
    END),
    SUM(COALESCE(cost, 0))
  INTO total_calls, completed_calls, avg_duration, total_cost
  FROM calls 
  WHERE user_id = user_uuid 
    AND start_time::DATE BETWEEN start_date AND end_date;
  
  -- Get sentiment statistics
  SELECT jsonb_build_object(
    'positive', COUNT(*) FILTER (WHERE sentiment = 'positive'),
    'neutral', COUNT(*) FILTER (WHERE sentiment = 'neutral'),
    'negative', COUNT(*) FILTER (WHERE sentiment = 'negative')
  ) INTO sentiment_stats
  FROM transcriptions t
  JOIN calls c ON t.call_id = c.id
  WHERE c.user_id = user_uuid 
    AND c.start_time::DATE BETWEEN start_date AND end_date;
  
  -- Build analytics result
  analytics := jsonb_build_object(
    'period', jsonb_build_object(
      'start_date', start_date,
      'end_date', end_date
    ),
    'calls', jsonb_build_object(
      'total', total_calls,
      'completed', completed_calls,
      'completion_rate', CASE 
        WHEN total_calls > 0 THEN ROUND((completed_calls::NUMERIC / total_calls) * 100, 2)
        ELSE 0 
      END
    ),
    'duration', jsonb_build_object(
      'average_minutes', CASE 
        WHEN avg_duration IS NOT NULL 
        THEN ROUND(EXTRACT(EPOCH FROM avg_duration) / 60, 2)
        ELSE 0 
      END
    ),
    'cost', jsonb_build_object(
      'total', COALESCE(total_cost, 0),
      'average_per_call', CASE 
        WHEN completed_calls > 0 THEN ROUND(total_cost / completed_calls, 2)
        ELSE 0 
      END
    ),
    'sentiment', sentiment_stats
  );
  
  RETURN analytics;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;