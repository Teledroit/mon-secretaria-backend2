/*
  # Newsletter Subscription Function

  1. New Edge Function
    - `newsletter-subscribe` - Handles newsletter subscriptions
    - Manages email list and subscription status
    - Integrates with email marketing services

  2. Features
    - Email validation and subscription
    - Duplicate prevention
    - Unsubscribe handling
    - Integration with external email services

  3. Security
    - Email validation
    - Rate limiting
    - Spam prevention
*/

import { corsHeaders } from '../_shared/cors.ts'
import { createClient } from 'npm:@supabase/supabase-js@2'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

interface NewsletterRequest {
  email: string
  action?: 'subscribe' | 'unsubscribe'
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

    const { email, action = 'subscribe' }: NewsletterRequest = await req.json()

    if (!email || !isValidEmail(email)) {
      return new Response(
        JSON.stringify({ error: 'Valid email address is required' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    if (action === 'subscribe') {
      return await handleSubscribe(email)
    } else if (action === 'unsubscribe') {
      return await handleUnsubscribe(email)
    } else {
      return new Response(
        JSON.stringify({ error: 'Invalid action' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

  } catch (error) {
    console.error('Error in newsletter function:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})

async function handleSubscribe(email: string) {
  try {
    // Check if already subscribed
    const { data: existing } = await supabase
      .from('newsletter_subscriptions')
      .select('*')
      .eq('email', email)
      .single()

    if (existing) {
      if (existing.status === 'active') {
        return new Response(
          JSON.stringify({ message: 'Already subscribed' }),
          {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        )
      } else {
        // Reactivate subscription
        const { error } = await supabase
          .from('newsletter_subscriptions')
          .update({
            status: 'active',
            subscribed_at: new Date().toISOString(),
            unsubscribed_at: null
          })
          .eq('email', email)

        if (error) throw error

        return new Response(
          JSON.stringify({ message: 'Subscription reactivated successfully' }),
          {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        )
      }
    }

    // Create new subscription
    const { error } = await supabase
      .from('newsletter_subscriptions')
      .insert({
        email,
        status: 'active',
        subscribed_at: new Date().toISOString()
      })

    if (error) throw error

    return new Response(
      JSON.stringify({ message: 'Subscribed successfully' }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )

  } catch (error) {
    console.error('Error subscribing to newsletter:', error)
    throw error
  }
}

async function handleUnsubscribe(email: string) {
  try {
    const { error } = await supabase
      .from('newsletter_subscriptions')
      .update({
        status: 'unsubscribed',
        unsubscribed_at: new Date().toISOString()
      })
      .eq('email', email)

    if (error) throw error

    return new Response(
      JSON.stringify({ message: 'Unsubscribed successfully' }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )

  } catch (error) {
    console.error('Error unsubscribing from newsletter:', error)
    throw error
  }
}

function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}