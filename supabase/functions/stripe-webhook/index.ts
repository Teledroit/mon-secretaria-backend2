/*
  # Stripe Webhook Handler

  1. New Edge Function
    - `stripe-webhook` - Handles Stripe webhook events
    - Processes subscription updates, payments, and cancellations
    - Syncs Stripe data with Supabase database

  2. Features
    - Webhook signature verification
    - Subscription lifecycle management
    - Payment processing and updates
    - Customer data synchronization

  3. Security
    - Webhook signature validation
    - Secure event processing
    - Database transaction safety
*/

import { corsHeaders } from '../_shared/cors.ts'
import { createClient } from 'npm:@supabase/supabase-js@2'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY')
const stripeWebhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')

const supabase = createClient(supabaseUrl, supabaseServiceKey)

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    })
  }

  try {
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        {
          status: 405,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    if (!stripeSecretKey || !stripeWebhookSecret) {
      return new Response(
        JSON.stringify({ error: 'Stripe not configured' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    const body = await req.text()
    const signature = req.headers.get('stripe-signature')

    if (!signature) {
      return new Response(
        JSON.stringify({ error: 'Missing stripe signature' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Verify webhook signature
    const event = await verifyWebhookSignature(body, signature, stripeWebhookSecret)

    console.log('Processing Stripe webhook event:', event.type)

    // Process the event
    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await handleSubscriptionUpdate(event.data.object)
        break

      case 'customer.subscription.deleted':
        await handleSubscriptionCancellation(event.data.object)
        break

      case 'invoice.payment_succeeded':
        await handlePaymentSuccess(event.data.object)
        break

      case 'invoice.payment_failed':
        await handlePaymentFailure(event.data.object)
        break

      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object)
        break

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return new Response(
      JSON.stringify({ received: true }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )

  } catch (error) {
    console.error('Error processing webhook:', error)
    return new Response(
      JSON.stringify({ error: 'Webhook processing failed' }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})

async function verifyWebhookSignature(body: string, signature: string, secret: string) {
  const encoder = new TextEncoder()
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['verify']
  )

  const sigElements = signature.split(',')
  const timestamp = sigElements.find(el => el.startsWith('t='))?.split('=')[1]
  const signatures = sigElements.filter(el => el.startsWith('v1='))

  if (!timestamp || signatures.length === 0) {
    throw new Error('Invalid signature format')
  }

  const payload = `${timestamp}.${body}`
  const payloadBytes = encoder.encode(payload)

  for (const sig of signatures) {
    const expectedSig = sig.split('=')[1]
    const expectedSigBytes = new Uint8Array(
      expectedSig.match(/.{2}/g)!.map(byte => parseInt(byte, 16))
    )

    const isValid = await crypto.subtle.verify(
      'HMAC',
      key,
      expectedSigBytes,
      payloadBytes
    )

    if (isValid) {
      return JSON.parse(body)
    }
  }

  throw new Error('Invalid signature')
}

async function handleSubscriptionUpdate(subscription: any) {
  try {
    const { error } = await supabase
      .from('stripe_subscriptions')
      .upsert({
        customer_id: subscription.customer,
        subscription_id: subscription.id,
        price_id: subscription.items.data[0]?.price?.id,
        status: subscription.status,
        current_period_start: subscription.current_period_start,
        current_period_end: subscription.current_period_end,
        cancel_at_period_end: subscription.cancel_at_period_end,
        updated_at: new Date().toISOString()
      })

    if (error) throw error
    console.log('Subscription updated:', subscription.id)

  } catch (error) {
    console.error('Error updating subscription:', error)
    throw error
  }
}

async function handleSubscriptionCancellation(subscription: any) {
  try {
    const { error } = await supabase
      .from('stripe_subscriptions')
      .update({
        status: 'canceled',
        deleted_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('subscription_id', subscription.id)

    if (error) throw error
    console.log('Subscription cancelled:', subscription.id)

  } catch (error) {
    console.error('Error cancelling subscription:', error)
    throw error
  }
}

async function handlePaymentSuccess(invoice: any) {
  try {
    // Update subscription payment status if applicable
    if (invoice.subscription) {
      const { error } = await supabase
        .from('stripe_subscriptions')
        .update({
          payment_method_brand: invoice.charge?.payment_method_details?.card?.brand,
          payment_method_last4: invoice.charge?.payment_method_details?.card?.last4,
          updated_at: new Date().toISOString()
        })
        .eq('subscription_id', invoice.subscription)

      if (error) throw error
    }

    console.log('Payment succeeded for invoice:', invoice.id)

  } catch (error) {
    console.error('Error handling payment success:', error)
    throw error
  }
}

async function handlePaymentFailure(invoice: any) {
  try {
    // Handle failed payment logic here
    console.log('Payment failed for invoice:', invoice.id)
    
    // You could send notifications, update user status, etc.

  } catch (error) {
    console.error('Error handling payment failure:', error)
    throw error
  }
}

async function handleCheckoutCompleted(session: any) {
  try {
    if (session.mode === 'subscription') {
      // Subscription checkout completed
      console.log('Subscription checkout completed:', session.id)
    } else {
      // One-time payment completed
      const { error } = await supabase
        .from('stripe_orders')
        .insert({
          checkout_session_id: session.id,
          payment_intent_id: session.payment_intent,
          customer_id: session.customer,
          amount_subtotal: session.amount_subtotal,
          amount_total: session.amount_total,
          currency: session.currency,
          payment_status: session.payment_status,
          status: 'completed'
        })

      if (error) throw error
      console.log('Order created for session:', session.id)
    }

  } catch (error) {
    console.error('Error handling checkout completion:', error)
    throw error
  }
}