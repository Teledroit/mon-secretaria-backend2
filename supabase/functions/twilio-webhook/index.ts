/*
  # Twilio Webhook Handler - logs caller number always, plays natural French welcome
*/

import { corsHeaders } from './_shared/cors.ts'
import { createClient } from 'npm:@supabase/supabase-js@2'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders })
  }

  try {
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const formData = await req.formData()
    const callData = Object.fromEntries(formData.entries())
    console.log('Incoming Twilio webhook:', callData)

    const from = callData.From as string
    const to = callData.To as string
    const callSid = callData.CallSid as string
    const callStatus = callData.CallStatus as string
    console.log('Call details:', { from, to, callSid, callStatus })

    const { data: phoneNumber } = await supabase
      .from('twilio_phone_numbers')
      .select('account_id')
      .eq('phone_number', to)
      .maybeSingle()

    let userId: string | null = null
    if (!phoneNumber) {
      console.warn('Phone number not found, using fallback:', to)
      const { data: fallbackAccount } = await supabase
        .from('twilio_accounts').select('user_id').eq('status', 'active').limit(1).maybeSingle()
      if (!fallbackAccount) return generateErrorResponse('No active accounts')
      userId = fallbackAccount.user_id
    } else {
      const { data: twilioAccount } = await supabase
        .from('twilio_accounts').select('user_id').eq('id', phoneNumber.account_id).maybeSingle()
      if (!twilioAccount) return generateErrorResponse('Account not found')
      userId = twilioAccount.user_id
    }

    const { data: config } = await supabase
      .from('configurations').select('*').eq('user_id', userId)
      .order('created_at', { ascending: false }).limit(1).maybeSingle()

    const finalConfig = config || {
      welcome_message: "Bonjour, vous etes en communication avec l'assistant virtuel du cabinet. Comment puis-je vous aider ?",
      nlp_engine: 'gpt-3.5-turbo', tts_engine: 'elevenlabs', voice_type: 'female', temperature: 0.7,
      working_days: [1,2,3,4,5], working_hours_start: '09:00', working_hours_end: '18:00'
    }

    if (!checkServiceAvailability(finalConfig)) {
      return generateOutOfHoursResponse(finalConfig)
    }

    // ALWAYS log caller number from Twilio's From field, even without name
    const { data: call, error: callError } = await supabase
      .from('calls').insert({
        user_id: userId,
        start_time: new Date().toISOString(),
        phone_number: from,
        call_sid: callSid,
        status: 'in-progress',
        client_name: null,
        sentiment: null,
        appointment_type: null,
        transcript: JSON.stringify([])
      }).select().maybeSingle()

    if (callError) console.error('Error logging call:', callError)
    else console.log('Call logged with phone_number:', from)

    switch (callStatus) {
      case 'ringing':
      case 'in-progress':
        return await generateWelcomeResponse(finalConfig, userId)
      case 'completed':
        if (call) {
          await supabase.from('calls').update({ end_time: new Date().toISOString(), status: 'completed' }).eq('id', call.id)
        }
        return new Response('OK', { status: 200 })
      default:
        return await generateWelcomeResponse(finalConfig, userId)
    }
  } catch (error) {
    console.error('Error processing Twilio webhook:', error)
    return generateErrorResponse('Internal server error')
  }
})

function getTwilioVoice(config: any): string {
  return (config?.voice_type || 'female') === 'male' ? 'Mathieu' : 'alice'
}

async function generateWelcomeResponse(config: any, userId: string) {
  const welcomeMessage = config?.welcome_message ||
    "Bonjour, vous etes en communication avec l'assistant virtuel du cabinet. Comment puis-je vous aider ?"

  try {
    const elevenlabsKey = Deno.env.get('ELEVENLABS_API_KEY')
    const voiceId = config?.voice_id || 'TxGEqnHWrfWFTfGW9XjX'

    if (elevenlabsKey && voiceId) {
      const ttsResponse = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
        method: 'POST',
        headers: { 'xi-api-key': elevenlabsKey, 'Content-Type': 'application/json', 'Accept': 'audio/mpeg' },
        body: JSON.stringify({
          text: welcomeMessage,
          model_id: 'eleven_multilingual_v2',
          voice_settings: { stability: 0.5, similarity_boost: 0.85, style: 0.45, use_speaker_boost: true }
        })
      })

      if (ttsResponse.ok) {
        const audioBuffer = await ttsResponse.arrayBuffer()
        const fileName = `welcome-${userId}-${Date.now()}.mp3`
        const upload = await supabase.storage.from('call-audio').upload(fileName, audioBuffer, {
          contentType: 'audio/mpeg', upsert: false
        })
        if (upload.error) throw new Error(upload.error.message)
        const { data: publicUrl } = supabase.storage.from('call-audio').getPublicUrl(fileName)
        const audioUrl = publicUrl.publicUrl

        const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Play>${audioUrl}</Play>
  <Gather input="speech" language="fr-FR" speechTimeout="auto" action="${supabaseUrl}/functions/v1/twilio-speech-handler" method="POST">
    <Pause length="1"/>
  </Gather>
  <Say voice="alice" language="fr-FR">Je n'ai pas bien entendu. Au revoir.</Say>
  <Hangup/>
</Response>`
        return new Response(twiml, { status: 200, headers: { ...corsHeaders, 'Content-Type': 'text/xml' } })
      }
    }
  } catch (error) {
    console.error('ElevenLabs error:', error)
  }

  const voice = getTwilioVoice(config)
  const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="${voice}" language="fr-FR">${welcomeMessage}</Say>
  <Gather input="speech" language="fr-FR" speechTimeout="auto" action="${supabaseUrl}/functions/v1/twilio-speech-handler" method="POST">
    <Say voice="${voice}" language="fr-FR">Je vous ecoute...</Say>
  </Gather>
  <Say voice="${voice}" language="fr-FR">Je n'ai pas bien entendu. Au revoir.</Say>
  <Hangup/>
</Response>`
  return new Response(twiml, { status: 200, headers: { ...corsHeaders, 'Content-Type': 'text/xml' } })
}

function checkServiceAvailability(config: any): boolean {
  try {
    const now = new Date()
    const parisTime = new Date(now.toLocaleString('en-US', { timeZone: 'Europe/Paris' }))
    const currentDay = parisTime.getDay()
    const currentTime = `${parisTime.getHours().toString().padStart(2,'0')}:${parisTime.getMinutes().toString().padStart(2,'0')}`
    if (Array.isArray(config.working_days)) {
      const days = config.working_days.map((d: any) => typeof d === 'string' ? parseInt(d, 10) : d)
      if (!days.includes(currentDay)) return false
    }
    if (config.working_hours_start && config.working_hours_end) {
      if (currentTime < config.working_hours_start || currentTime >= config.working_hours_end) return false
    }
    return true
  } catch { return true }
}

function generateOutOfHoursResponse(config: any) {
  const voice = getTwilioVoice(config)
  const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="${voice}" language="fr-FR">Bonjour, vous appelez en dehors de nos heures d'ouverture. Merci de rappeler pendant nos heures de service. Au revoir.</Say>
  <Hangup/>
</Response>`
  return new Response(twiml, { status: 200, headers: { ...corsHeaders, 'Content-Type': 'text/xml' } })
}

function generateErrorResponse(message: string) {
  console.error('Generating error response:', message)
  const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice" language="fr-FR">Desole, une erreur technique est survenue. Veuillez rappeler plus tard.</Say>
  <Hangup/>
</Response>`
  return new Response(twiml, { status: 200, headers: { ...corsHeaders, 'Content-Type': 'text/xml' } })
}
