/*
  # Twilio Speech Handler - uses AI ElevenLabs audioUrl, fallback French
*/

import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE',
}

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response(null, { status: 200, headers: corsHeaders })

  try {
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const formData = await req.formData()
    const speechData = Object.fromEntries(formData.entries())
    const speechResult = speechData.SpeechResult as string
    const callSid = speechData.CallSid as string
    const from = speechData.From as string
    const to = speechData.To as string
    console.log(`Speech from ${from}: "${speechResult}"`)

    const { data: phoneNumber } = await supabase
      .from('twilio_phone_numbers').select('account_id').eq('phone_number', to).maybeSingle()

    let userId: string | null = null
    let config: any = null

    if (!phoneNumber) {
      const { data: fallbackAccount } = await supabase
        .from('twilio_accounts').select('user_id').eq('status', 'active').limit(1).maybeSingle()
      if (!fallbackAccount) return generateErrorResponse()
      userId = fallbackAccount.user_id
    } else {
      const { data: twilioAccount } = await supabase
        .from('twilio_accounts').select('user_id').eq('id', phoneNumber.account_id).maybeSingle()
      if (!twilioAccount) return generateErrorResponse()
      userId = twilioAccount.user_id
    }

    const { data: configData } = await supabase
      .from('configurations').select('*').eq('user_id', userId)
      .order('created_at', { ascending: false }).limit(1).maybeSingle()
    config = configData

    if (!speechResult || speechResult.trim() === '') return generateRetryResponse(config)

    try {
      const aiResponse = await fetch(`${supabaseUrl}/functions/v1/ai-conversation`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseServiceKey}`,
        },
        body: JSON.stringify({
          text: speechResult,
          callSid,
          userId,
          config: {
            nlpEngine: config?.nlp_engine || 'gpt-3.5-turbo',
            ttsEngine: config?.tts_engine || 'elevenlabs',
            voiceId: config?.voice_id,
            voiceType: config?.voice_type || 'female',
            temperature: config?.temperature || 0.7,
            systemInstructions: config?.system_instructions,
            welcomeMessage: config?.welcome_message
          }
        })
      })
      if (!aiResponse.ok) throw new Error(`AI conversation failed: ${await aiResponse.text()}`)
      const aiResult = await aiResponse.json()
      return generateAIResponse(aiResult, config)
    } catch (error) {
      console.error('AI error:', error)
      return generateFallbackResponse(config)
    }
  } catch (error) {
    console.error('Speech handler error:', error)
    return generateErrorResponse()
  }
})

function getTwilioVoice(config: any): string {
  return (config?.voice_type || 'female') === 'male' ? 'Mathieu' : 'alice'
}

function generateAIResponse(aiResult: any, config: any) {
  const voice = getTwilioVoice(config)
  let twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>`

  if (aiResult.audioUrl) {
    twiml += `<Play>${aiResult.audioUrl}</Play>`
  } else {
    const safeText = (aiResult.text || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    twiml += `<Say voice="${voice}" language="fr-FR">${safeText}</Say>`
  }

  switch (aiResult.nextAction) {
    case 'transfer':
      if (aiResult.transferNumber || config?.transfer_number) {
        twiml += `<Dial>${aiResult.transferNumber || config.transfer_number}</Dial>`
      } else {
        twiml += `<Say voice="${voice}" language="fr-FR">Je vais vous transferer vers un avocat. Au revoir.</Say><Hangup/>`
      }
      break
    case 'schedule':
      twiml += `<Say voice="${voice}" language="fr-FR">Parfait, votre demande de rendez-vous a bien ete enregistree.</Say><Hangup/>`
      break
    case 'hangup':
      twiml += `<Say voice="${voice}" language="fr-FR">Au revoir, bonne journee !</Say><Hangup/>`
      break
    default:
      twiml += `<Gather input="speech" language="fr-FR" speechTimeout="auto" action="${supabaseUrl}/functions/v1/twilio-speech-handler" method="POST"><Pause length="1"/></Gather>`
      twiml += `<Say voice="${voice}" language="fr-FR">Je n'ai pas bien entendu. Au revoir.</Say><Hangup/>`
  }

  twiml += `</Response>`
  return new Response(twiml, { status: 200, headers: { ...corsHeaders, 'Content-Type': 'text/xml' } })
}

function generateRetryResponse(config?: any) {
  const voice = getTwilioVoice(config)
  const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="${voice}" language="fr-FR">Je n'ai pas bien compris. Pouvez-vous repeter ?</Say>
  <Gather input="speech" language="fr-FR" speechTimeout="auto" action="${supabaseUrl}/functions/v1/twilio-speech-handler" method="POST"><Pause length="1"/></Gather>
  <Say voice="${voice}" language="fr-FR">Au revoir.</Say><Hangup/>
</Response>`
  return new Response(twiml, { status: 200, headers: { ...corsHeaders, 'Content-Type': 'text/xml' } })
}

function generateFallbackResponse(config?: any) {
  const voice = getTwilioVoice(config)
  const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="${voice}" language="fr-FR">Je peux vous aider avec la prise de rendez-vous ou vous transferer vers un avocat. Que preferez-vous ?</Say>
  <Gather input="speech" language="fr-FR" speechTimeout="auto" action="${supabaseUrl}/functions/v1/twilio-speech-handler" method="POST"><Pause length="1"/></Gather>
  <Say voice="${voice}" language="fr-FR">Au revoir.</Say><Hangup/>
</Response>`
  return new Response(twiml, { status: 200, headers: { ...corsHeaders, 'Content-Type': 'text/xml' } })
}

function generateErrorResponse() {
  const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice" language="fr-FR">Desole, une erreur technique est survenue. Veuillez rappeler plus tard.</Say>
  <Hangup/>
</Response>`
  return new Response(twiml, { status: 200, headers: { ...corsHeaders, 'Content-Type': 'text/xml' } })
}
