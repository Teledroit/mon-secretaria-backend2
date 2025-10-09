import { STRIPE_PRODUCTS } from '@/stripe-config';
import { supabase } from './supabase';
import { logger } from './logger';

export async function createCheckoutSession(
  priceId: string,
  mode: 'payment' | 'subscription',
  successUrl: string,
  cancelUrl: string
) {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.access_token) {
      throw new Error('User not authenticated');
    }

    const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/stripe-checkout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({
        price_id: priceId,
        mode,
        success_url: successUrl,
        cancel_url: cancelUrl,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create checkout session');
    }

    const { sessionId, url } = await response.json();

    if (!url) {
      throw new Error('No checkout URL returned');
    }

    return { sessionId, url };
  } catch (error: any) {
    logger.error('Error creating checkout session', error);
    throw error;
  }
}

export async function redirectToCheckout(productId: keyof typeof STRIPE_PRODUCTS) {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      throw new Error('Please log in to continue');
    }

    const product = STRIPE_PRODUCTS[productId];
    if (!product) {
      throw new Error('Invalid product ID');
    }

    const { url } = await createCheckoutSession(
      product.priceId,
      product.mode,
      `${window.location.origin}/checkout/success`,
      `${window.location.origin}/checkout/canceled`
    );

    window.location.href = url;
  } catch (error) {
    logger.error('Error redirecting to checkout', error);
    throw error;
  }
}

export async function getSubscriptionStatus() {
  try {
    // Get session to ensure user is authenticated
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return null;

    // Add retry logic with exponential backoff
    const maxRetries = 3;
    let retryCount = 0;
    let lastError;

    while (retryCount < maxRetries) {
      try {
        const { data, error } = await supabase
          .from('stripe_user_subscriptions')
          .select('subscription_id, subscription_status, price_id')
          .maybeSingle();

        if (error) throw error;
        if (data) return data;

        // If no data found, wait before retrying
        await new Promise(resolve => setTimeout(resolve, 2000 * Math.pow(2, retryCount)));
        retryCount++;
      } catch (err) {
        lastError = err;
        retryCount++;
        if (retryCount === maxRetries) break;
        await new Promise(resolve => setTimeout(resolve, 2000 * Math.pow(2, retryCount)));
      }
    }

    if (lastError) {
      logger.error('Error fetching subscription status', lastError);
      throw lastError;
    }

    return null;
  } catch (error) {
    logger.error('Error fetching subscription status', error);
    throw error;
  }
}