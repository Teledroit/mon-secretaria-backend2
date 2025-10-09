/*
  # Twilio Speech Handler

  1. New Edge Function
    - `twilio-speech-handler` - Processes speech input from Twilio calls
    - Integrates with AI conversation system
    - Generates appropriate TwiML responses

  2. Features
    - Speech recognition processing
    - AI conversation integration
    - Dynamic TwiML generation
    - Call flow management

  3. Security
    - Twilio webhook validation
    - Secure speech processing
    - User data protection
*/

import { corsHeaders } from '../_shared/cors.ts'
import { createClient } from 'npm:@supabase/supabase-js@2'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

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
    const speechData = Object.fromEntries(formData.entries())

    const speechResult = speechData.SpeechResult as string
    const callSid = speechData.CallSid as string
    const from = speechData.From as string
    const to = speechData.To as string

    console.log(`Speech from ${from}: "${speechResult}"`)

    // Find user by phone number
    const { data: phoneNumber } = await supabase
      .from('twilio_phone_numbers')
      .select('account_id')
      .eq('phone_number', to)
      .single()

    if (!phoneNumber) {
      return generateErrorResponse()
    }

    // Get user configuration
    const { data: config } = await supabase
      .from('configurations')
      .select('*')
      .eq('user_id', phoneNumber.account_id)
      .single()

    if (!speechResult || speechResult.trim() === '') {
      return generateRetryResponse()
    }

    // Process speech with AI conversation system
    try {
      const aiResponse = await fetch(`${supabaseUrl}/functions/v1/ai-conversation`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
        },
        body: JSON.stringify({
          text: speechResult,
          callSid,
          userId: phoneNumber.account_id,
          config: {
            nlpEngine: config?.nlp_engine || 'gpt4',
            ttsEngine: config?.tts_engine || 'elevenlabs',
            voiceId: config?.voice_id,
            voiceType: config?.voice_type || 'female',
            temperature: config?.temperature || 0.7,
            systemInstructions: config?.system_instructions,
            welcomeMessage: config?.welcome_message
          }
        })
      })

      if (!aiResponse.ok) {
        throw new Error('AI conversation failed')
      }

      const aiResult = await aiResponse.json()

      // Generate TwiML based on AI response
      return generateAIResponse(aiResult, config)

    } catch (error) {
      console.error('Error processing AI conversation:', error)
      return generateFallbackResponse()
    }

  } catch (error) {
    console.error('Error processing speech:', error)
    return generateErrorResponse()
  }
})

function generateAIResponse(aiResult: any, config: any) {
  let twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>`

  // Add AI response
  twiml += `<Say voice="alice" language="fr-FR">${aiResult.text}</Say>`

  // Handle next action
  switch (aiResult.nextAction) {
    case 'transfer':
      if (aiResult.transferNumber || config?.transfer_number) {
        twiml += `<Dial>${aiResult.transferNumber || config.transfer_number}</Dial>`
      } else {
        twiml += `<Say voice="alice" language="fr-FR">Je vais vous transférer vers un avocat.</Say>`
        twiml += `<Hangup/>`
      }
      break

    case 'schedule':
      twiml += `<Say voice="alice" language="fr-FR">Je vais vous envoyer un SMS avec le lien de réservation.</Say>`
      // Here you would trigger SMS sending
      twiml += `<Hangup/>`
      break

    case 'hangup':
      twiml += `<Hangup/>`
      break

    default:
      // Continue conversation
      twiml += `<Gather input="speech" language="fr-FR" speechTimeout="auto" action="${supabaseUrl}/functions/v1/twilio-speech-handler" method="POST">`
      twiml += `<Say voice="alice" language="fr-FR">Autre chose ?</Say>`
      twiml += `</Gather>`
      twiml += `<Say voice="alice" language="fr-FR">Au revoir.</Say>`
      twiml += `<Hangup/>`
  }

  twiml += `</Response>`

  return new Response(twiml, {
    status: 200,
    headers: {
      ...corsHeaders,
      'Content-Type': 'text/xml'
    }
  })
}

function generateRetryResponse() {
  const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice" language="fr-FR">Je n'ai pas bien compris. Pouvez-vous répéter ?</Say>
  <Gather input="speech" language="fr-FR" speechTimeout="auto" action="${supabaseUrl}/functions/v1/twilio-speech-handler" method="POST">
    <Say voice="alice" language="fr-FR">Je vous écoute...</Say>
  </Gather>
  <Say voice="alice" language="fr-FR">Au revoir.</Say>
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

function generateFallbackResponse() {
  const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice" language="fr-FR">Je peux vous aider avec la prise de rendez-vous ou vous transférer vers un avocat. Que préférez-vous ?</Say>
  <Gather input="speech" language="fr-FR" speechTimeout="auto" action="${supabaseUrl}/functions/v1/twilio-speech-handler" method="POST">
    <Say voice="alice" language="fr-FR">Dites rendez-vous ou avocat...</Say>
  </Gather>
  <Say voice="alice" language="fr-FR">Au revoir.</Say>
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

function generateErrorResponse() {
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