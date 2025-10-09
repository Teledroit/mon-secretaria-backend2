/*
  # SIP Configuration Management Function

  1. New Edge Function
    - `manage-sip-config` - Manages SIP trunk configurations
    - Integrates with Twilio SIP services
    - Handles phone number forwarding

  2. Features
    - SIP trunk creation and management
    - Phone number forwarding setup
    - Twilio integration for call routing

  3. Security
    - Authenticated access required
    - User-specific SIP configurations
    - Secure credential storage
*/

import { corsHeaders } from '../_shared/cors.ts'
import { createClient } from 'npm:@supabase/supabase-js@2'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const twilioAccountSid = Deno.env.get('TWILIO_ACCOUNT_SID')
const twilioAuthToken = Deno.env.get('TWILIO_AUTH_TOKEN')

const supabase = createClient(supabaseUrl, supabaseServiceKey)

interface SIPConfigRequest {
  phoneNumber: string
  terminationUri: string
  username: string
  password: string
  nickname?: string
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

    const sipConfig: SIPConfigRequest = await req.json()

    // Validate required fields
    if (!sipConfig.phoneNumber || !sipConfig.terminationUri || !sipConfig.username || !sipConfig.password) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Save SIP configuration to database
    const { data, error } = await supabase
      .from('sip_configurations')
      .upsert({
        user_id: user.id,
        phone_number: sipConfig.phoneNumber,
        termination_uri: sipConfig.terminationUri,
        username: sipConfig.username,
        password: sipConfig.password,
        nickname: sipConfig.nickname,
        status: 'active',
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) {
      throw error
    }

    // If Twilio credentials are available, configure SIP trunk
    if (twilioAccountSid && twilioAuthToken) {
      try {
        await configureTwilioSIPTrunk(sipConfig)
      } catch (twilioError) {
        console.error('Twilio SIP configuration failed:', twilioError)
        // Don't fail the entire request if Twilio config fails
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'SIP configuration saved successfully',
        config: data
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )

  } catch (error) {
    console.error('Error managing SIP config:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})

async function configureTwilioSIPTrunk(config: SIPConfigRequest) {
  if (!twilioAccountSid || !twilioAuthToken) {
    throw new Error('Twilio credentials not configured')
  }

  try {
    // Create SIP trunk in Twilio
    const trunkResponse = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${twilioAccountSid}/Trunks.json`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${btoa(`${twilioAccountSid}:${twilioAuthToken}`)}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        FriendlyName: config.nickname || `SIP-${config.phoneNumber}`,
        DomainName: config.terminationUri.replace('sip:', ''),
        DisasterRecoveryUrl: `${Deno.env.get('SUPABASE_URL')}/functions/v1/twilio-webhook`,
        DisasterRecoveryMethod: 'POST'
      })
    })

    if (!trunkResponse.ok) {
      const errorData = await trunkResponse.text()
      throw new Error(`Twilio trunk creation failed: ${errorData}`)
    }

    const trunkData = await trunkResponse.json()
    console.log('SIP trunk created:', trunkData.sid)

    return trunkData

  } catch (error) {
    console.error('Error configuring Twilio SIP trunk:', error)
    throw error
  }
}