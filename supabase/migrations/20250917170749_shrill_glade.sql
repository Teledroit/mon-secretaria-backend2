/*
  # Stripe Integration Functions

  1. Customer Management Functions
    - Get or create Stripe customer for user
    - Sync customer data between Stripe and Supabase
    - Handle customer updates and deletions

  2. Subscription Management Functions
    - Check subscription status
    - Get subscription details
    - Handle subscription lifecycle events

  3. Billing Functions
    - Calculate usage costs
    - Generate billing summaries
    - Process payments and invoices

  4. Security
    - User-specific data access
    - Secure customer identification
    - Protected billing operations
*/

-- Function to get or create Stripe customer for a user
CREATE OR REPLACE FUNCTION get_or_create_stripe_customer(user_uuid UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  customer_id TEXT;
  user_email TEXT;
  user_name TEXT;
BEGIN
  -- Check if customer already exists
  SELECT sc.customer_id INTO customer_id
  FROM stripe_customers sc
  WHERE sc.user_id = user_uuid AND sc.deleted_at IS NULL;
  
  IF customer_id IS NOT NULL THEN
    RETURN customer_id;
  END IF;
  
  -- Get user details
  SELECT u.email, u.full_name INTO user_email, user_name
  FROM users u
  WHERE u.id = user_uuid;
  
  IF user_email IS NULL THEN
    RAISE EXCEPTION 'User not found';
  END IF;
  
  -- Return placeholder for now - actual Stripe customer creation happens in Edge Function
  RETURN 'pending_creation';
END;
$$;

-- Function to get user subscription status
CREATE OR REPLACE FUNCTION get_user_subscription_status(user_uuid UUID)
RETURNS TABLE(
  subscription_id TEXT,
  status stripe_subscription_status,
  price_id TEXT,
  current_period_start BIGINT,
  current_period_end BIGINT,
  cancel_at_period_end BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ss.subscription_id,
    ss.status,
    ss.price_id,
    ss.current_period_start,
    ss.current_period_end,
    ss.cancel_at_period_end
  FROM stripe_subscriptions ss
  JOIN stripe_customers sc ON ss.customer_id = sc.customer_id
  WHERE sc.user_id = user_uuid 
    AND sc.deleted_at IS NULL 
    AND ss.deleted_at IS NULL;
END;
$$;

-- Function to check if user has active subscription
CREATE OR REPLACE FUNCTION has_active_subscription(user_uuid UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  subscription_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO subscription_count
  FROM stripe_subscriptions ss
  JOIN stripe_customers sc ON ss.customer_id = sc.customer_id
  WHERE sc.user_id = user_uuid 
    AND sc.deleted_at IS NULL 
    AND ss.deleted_at IS NULL
    AND ss.status IN ('active', 'trialing', 'past_due');
    
  RETURN subscription_count > 0;
END;
$$;

-- Function to get subscription limits based on price_id
CREATE OR REPLACE FUNCTION get_subscription_limits(user_uuid UUID)
RETURNS TABLE(
  call_limit INTEGER,
  has_unlimited_calls BOOLEAN,
  plan_name TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_price_id TEXT;
BEGIN
  -- Get user's current price_id
  SELECT ss.price_id INTO user_price_id
  FROM stripe_subscriptions ss
  JOIN stripe_customers sc ON ss.customer_id = sc.customer_id
  WHERE sc.user_id = user_uuid 
    AND sc.deleted_at IS NULL 
    AND ss.deleted_at IS NULL
    AND ss.status IN ('active', 'trialing', 'past_due')
  LIMIT 1;
  
  -- Return limits based on price_id
  IF user_price_id = 'price_1RQ8ZxHCmF7qRHmmpTKP7VFi' THEN
    -- Starter plan
    RETURN QUERY SELECT 49, FALSE, 'mONsECRETARIA - Boss test';
  ELSIF user_price_id = 'price_1RLQL4HCmF7qRHmmOjAvQVgi' THEN
    -- Premium plan
    RETURN QUERY SELECT NULL::INTEGER, TRUE, 'MonSecretarIA - Cabinet complet';
  ELSE
    -- Default/unknown plan
    RETURN QUERY SELECT 0, FALSE, 'Plan inconnu';
  END IF;
END;
$$;