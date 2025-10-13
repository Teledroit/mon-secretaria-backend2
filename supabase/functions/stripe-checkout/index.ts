/*
  # Stripe Checkout Function

  1. New Edge Function
    - `stripe-checkout` - Creates Stripe checkout sessions
    - Handles subscription and one-time payment flows
    - Manages customer creation and updates

  2. Features
    - Dynamic checkout session creation
    - Customer management integration
    - Subscription and payment mode support
    - Success/cancel URL configuration

  3. Security
    - Authenticated access required
    - Customer data validation
    - Secure Stripe integration
*/

import { corsHeaders } from '../_shared/cors.ts'
import { createClient } from 'npm:@supabase/supabase-js@2'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY')

const supabase = createClient(supabaseUrl, supabaseServiceKey)

interface CheckoutRequest {
  price_id: string
  mode: 'payment' | 'subscription'
  success_url: string
  cancel_url: string
  customer_email?: string
}

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

    if (!stripeSecretKey) {
      return new Response(
        JSON.stringify({ error: 'Stripe not configured' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Get user from auth header
    const authHeader = req.headers.get('authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authorization required' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid authentication' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    const checkoutData: CheckoutRequest = await req.json()

    // Validate required fields
    if (!checkoutData.price_id || !checkoutData.mode || !checkoutData.success_url || !checkoutData.cancel_url) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Get or create Stripe customer
    let customerId = await getOrCreateStripeCustomer(user)

    // Create checkout session
    const sessionData = {
      customer: customerId,
      mode: checkoutData.mode,
      line_items: [{
        price: checkoutData.price_id,
        quantity: 1,
      }],
      success_url: checkoutData.success_url,
      cancel_url: checkoutData.cancel_url,
      allow_promotion_codes: true,
      billing_address_collection: 'required',
      customer_update: {
        address: 'auto',
        name: 'auto'
      }
    }

    if (checkoutData.mode === 'subscription') {
      sessionData.subscription_data = {
        metadata: {
          user_id: user.id
        }
      }
    }

    const sessionResponse = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${stripeSecretKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams(sessionData as any)
    })

    if (!sessionResponse.ok) {
      const errorData = await sessionResponse.text()
      console.error('Stripe checkout error:', errorData)
      throw new Error('Failed to create checkout session')
    }

    const session = await sessionResponse.json()

    return new Response(
      JSON.stringify({ 
        sessionId: session.id,
        url: session.url 
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )

  } catch (error) {
    console.error('Error creating checkout session:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})

async function getOrCreateStripeCustomer(user: any): Promise<string> {
  try {
    // Check if customer already exists
    const { data: existingCustomer } = await supabase
      .from('stripe_customers')
      .select('customer_id')
      .eq('user_id', user.id)
      .single()

    if (existingCustomer) {
      return existingCustomer.customer_id
    }

    // Get user details
    const { data: userData } = await supabase
      .from('users')
      .select('email, full_name, phone, company_name')
      .eq('id', user.id)
      .single()

    // Create new Stripe customer
    const customerResponse = await fetch('https://api.stripe.com/v1/customers', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('STRIPE_SECRET_KEY')}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        email: userData?.email || user.email,
        name: userData?.full_name || '',
        phone: userData?.phone || '',
        metadata: JSON.stringify({
          user_id: user.id,
          company_name: userData?.company_name || ''
        })
      })
    })

    if (!customerResponse.ok) {
      throw new Error('Failed to create Stripe customer')
    }

    const customer = await customerResponse.json()

    // Save customer to database
    await supabase
      .from('stripe_customers')
      .insert({
        user_id: user.id,
        customer_id: customer.id
      })

    return customer.id

  } catch (error) {
    console.error('Error getting/creating Stripe customer:', error)
    throw error
  }
}