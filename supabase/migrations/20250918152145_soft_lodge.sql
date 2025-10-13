/*
  # Stripe Integration Functions

  1. New Functions
    - `create_stripe_customer` - Crée un client Stripe
    - `update_subscription_status` - Met à jour le statut d'abonnement
    - `get_user_subscription` - Récupère l'abonnement d'un utilisateur
    - `process_stripe_webhook` - Traite les webhooks Stripe

  2. Features
    - Gestion automatique des clients Stripe
    - Synchronisation des abonnements
    - Traitement des paiements
    - Gestion des échecs de paiement

  3. Security
    - Validation des données Stripe
    - Gestion sécurisée des webhooks
    - Protection contre les doublons
*/

-- Function to create or get Stripe customer
CREATE OR REPLACE FUNCTION create_stripe_customer(
    user_uuid UUID,
    customer_id_param TEXT,
    email_param TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    existing_customer_id UUID;
    new_customer_id UUID;
BEGIN
    -- Check if customer already exists
    SELECT id INTO existing_customer_id
    FROM stripe_customers
    WHERE user_id = user_uuid AND deleted_at IS NULL;
    
    IF existing_customer_id IS NOT NULL THEN
        RETURN existing_customer_id;
    END IF;
    
    -- Create new customer record
    INSERT INTO stripe_customers (
        user_id,
        customer_id,
        created_at,
        updated_at
    ) VALUES (
        user_uuid,
        customer_id_param,
        NOW(),
        NOW()
    ) RETURNING id INTO new_customer_id;
    
    RETURN new_customer_id;
END;
$$;

-- Function to update subscription status
CREATE OR REPLACE FUNCTION update_subscription_status(
    subscription_id_param TEXT,
    status_param stripe_subscription_status,
    customer_id_param TEXT,
    price_id_param TEXT DEFAULT NULL,
    current_period_start_param BIGINT DEFAULT NULL,
    current_period_end_param BIGINT DEFAULT NULL,
    cancel_at_period_end_param BOOLEAN DEFAULT FALSE
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Upsert subscription record
    INSERT INTO stripe_subscriptions (
        customer_id,
        subscription_id,
        price_id,
        status,
        current_period_start,
        current_period_end,
        cancel_at_period_end,
        created_at,
        updated_at
    ) VALUES (
        customer_id_param,
        subscription_id_param,
        price_id_param,
        status_param,
        current_period_start_param,
        current_period_end_param,
        cancel_at_period_end_param,
        NOW(),
        NOW()
    )
    ON CONFLICT (customer_id) 
    DO UPDATE SET
        subscription_id = EXCLUDED.subscription_id,
        price_id = EXCLUDED.price_id,
        status = EXCLUDED.status,
        current_period_start = EXCLUDED.current_period_start,
        current_period_end = EXCLUDED.current_period_end,
        cancel_at_period_end = EXCLUDED.cancel_at_period_end,
        updated_at = NOW();
END;
$$;

-- Function to get user subscription details
CREATE OR REPLACE FUNCTION get_user_subscription(user_uuid UUID)
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
    AND ss.deleted_at IS NULL
    AND sc.deleted_at IS NULL;
END;
$$;

-- Function to process Stripe webhook events
CREATE OR REPLACE FUNCTION process_stripe_webhook(
    event_type TEXT,
    event_data JSONB
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    customer_id_val TEXT;
    subscription_id_val TEXT;
    user_uuid UUID;
BEGIN
    -- Extract common fields
    customer_id_val := event_data->>'customer';
    subscription_id_val := event_data->>'id';
    
    -- Find user by customer ID
    SELECT user_id INTO user_uuid
    FROM stripe_customers
    WHERE customer_id = customer_id_val AND deleted_at IS NULL;
    
    -- Process different event types
    CASE event_type
        WHEN 'customer.subscription.created', 'customer.subscription.updated' THEN
            PERFORM update_subscription_status(
                subscription_id_val,
                (event_data->>'status')::stripe_subscription_status,
                customer_id_val,
                event_data->'items'->'data'->0->'price'->>'id',
                (event_data->>'current_period_start')::BIGINT,
                (event_data->>'current_period_end')::BIGINT,
                (event_data->>'cancel_at_period_end')::BOOLEAN
            );
            
        WHEN 'customer.subscription.deleted' THEN
            UPDATE stripe_subscriptions
            SET 
                status = 'canceled',
                deleted_at = NOW(),
                updated_at = NOW()
            WHERE subscription_id = subscription_id_val;
            
        WHEN 'invoice.payment_succeeded' THEN
            -- Update payment method details if available
            IF event_data ? 'charge' THEN
                UPDATE stripe_subscriptions
                SET 
                    payment_method_brand = event_data->'charge'->'payment_method_details'->'card'->>'brand',
                    payment_method_last4 = event_data->'charge'->'payment_method_details'->'card'->>'last4',
                    updated_at = NOW()
                WHERE customer_id = customer_id_val;
            END IF;
            
        WHEN 'checkout.session.completed' THEN
            -- Handle one-time payments
            IF (event_data->>'mode') = 'payment' THEN
                INSERT INTO stripe_orders (
                    checkout_session_id,
                    payment_intent_id,
                    customer_id,
                    amount_subtotal,
                    amount_total,
                    currency,
                    payment_status,
                    status
                ) VALUES (
                    event_data->>'id',
                    event_data->>'payment_intent',
                    customer_id_val,
                    (event_data->>'amount_subtotal')::BIGINT,
                    (event_data->>'amount_total')::BIGINT,
                    event_data->>'currency',
                    event_data->>'payment_status',
                    'completed'
                );
            END IF;
            
        ELSE
            -- Log unhandled event types
            RAISE NOTICE 'Unhandled Stripe event type: %', event_type;
    END CASE;
    
    RETURN TRUE;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error processing Stripe webhook: %', SQLERRM;
        RETURN FALSE;
END;
$$;

-- Add missing indexes for Stripe operations
CREATE INDEX IF NOT EXISTS idx_stripe_customers_customer_id_active 
ON stripe_customers (customer_id) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_stripe_subscriptions_status_period 
ON stripe_subscriptions (status, current_period_end) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_stripe_orders_payment_status 
ON stripe_orders (payment_status, created_at DESC) WHERE deleted_at IS NULL;

-- Add missing constraints to Stripe tables
DO $$
BEGIN
    -- Add check constraint for subscription status
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.check_constraints 
        WHERE constraint_name = 'check_subscription_period_logic'
    ) THEN
        ALTER TABLE stripe_subscriptions ADD CONSTRAINT check_subscription_period_logic 
        CHECK (
            current_period_start IS NULL OR 
            current_period_end IS NULL OR 
            current_period_end > current_period_start
        );
    END IF;
    
    -- Add check constraint for order amounts
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.check_constraints 
        WHERE constraint_name = 'check_order_amount_logic'
    ) THEN
        ALTER TABLE stripe_orders ADD CONSTRAINT check_order_amount_logic 
        CHECK (amount_total >= amount_subtotal AND amount_subtotal >= 0);
    END IF;
END $$;