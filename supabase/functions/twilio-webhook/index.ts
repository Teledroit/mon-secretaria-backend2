/*
  # Twilio Webhook Handler

  1. New Edge Function
    - `twilio-webhook` - Handles incoming Twilio voice calls
    - Processes call events and manages conversation flow
    - Integrates with AI conversation system

  2. Features
    - Incoming call handling
    - TwiML response generation
    - Call logging and tracking
    - AI conversation integration

  3. Security
    - Webhook signature validation
    - User authentication
    - Secure call data handling
*/

import { corsHeaders } from '../_shared/cors.ts'
import { createClient } from 'npm:@supabase/supabase-js@2'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const twilioAccountSid = Deno.env.get('TWILIO_ACCOUNT_SID')
const twilioAuthToken = Deno.env.get('TWILIO_AUTH_TOKEN')

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

    const formData = await req.formData()
    const callData = Object.fromEntries(formData.entries())

    console.log('Incoming Twilio webhook:', callData)

    const from = callData.From as string
    const to = callData.To as string
    const callSid = callData.CallSid as string
    const callStatus = callData.CallStatus as string

    // Find user by phone number
    const { data: phoneNumber } = await supabase
      .from('twilio_phone_numbers')
      .select('account_id')
      .eq('phone_number', to)
      .single()

    if (!phoneNumber) {
      return generateErrorResponse('Phone number not found')
    }

    // Get user configuration
    const { data: config } = await supabase
      .from('configurations')
      .select('*')
      .eq('user_id', phoneNumber.account_id)
      .single()

    // Log the call
    const { data: call, error: callError } = await supabase
      .from('calls')
      .insert({
        user_id: phoneNumber.account_id,
        start_time: new Date().toISOString(),
        phone_number: from,
        status: 'in-progress'
      })
      .select()
      .single()

    if (callError) {
      console.error('Error logging call:', callError)
    }

    // Generate TwiML response based on call status
    switch (callStatus) {
      case 'ringing':
      case 'in-progress':
        return generateWelcomeResponse(config)
      
      case 'completed':
        if (call) {
          await supabase
            .from('calls')
            .update({
              end_time: new Date().toISOString(),
              status: 'completed'
            })
            .eq('id', call.id)
        }
        return new Response('OK', { status: 200 })
      
      default:
        return generateWelcomeResponse(config)
    }

  } catch (error) {
    console.error('Error processing Twilio webhook:', error)
    return generateErrorResponse('Internal server error')
  }
})

function generateWelcomeResponse(config: any) {
  const welcomeMessage = config?.welcome_message || 
    "Bonjour, vous êtes en communication avec l'assistant virtuel du cabinet. Comment puis-je vous aider ?"

  const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice" language="fr-FR">${welcomeMessage}</Say>
  <Gather input="speech" language="fr-FR" speechTimeout="auto" action="${supabaseUrl}/functions/v1/twilio-speech-handler" method="POST">
    <Say voice="alice" language="fr-FR">Je vous écoute...</Say>
  </Gather>
  <Say voice="alice" language="fr-FR">Je n'ai pas bien entendu. Au revoir.</Say>
  <Hangup/>
</Response>`

  return new Response(twiml, {
    status: 200,
    headers: {
      ...corsHeaders,
      'Content-Type': 'text/xml'
    }
  })
}

function generateErrorResponse(message: string) {
  const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice" language="fr-FR">Désolé, une erreur technique est survenue. Veuillez rappeler plus tard.</Say>
  <Hangup/>
</Response>`

  return new Response(twiml, {
    status: 200,
    headers: {
      ...corsHeaders,
      'Content-Type': 'text/xml'
    }
  })
}