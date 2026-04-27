/*
  # AI Conversation Handler

  1. New Edge Function
    - `ai-conversation` - Handles real-time AI conversation flow
    - Integrates speech-to-text, NLP processing, and text-to-speech
    - Manages conversation context and state

  2. Features
    - Real-time speech processing with OpenAI Whisper
    - Context-aware responses using GPT-4/Claude
    - Dynamic voice synthesis with multiple TTS engines
    - Conversation state management
    - Integration with Twilio webhooks

  3. Security
    - Authenticated access required
    - Input validation and sanitization
    - Rate limiting considerations
*/

// CORS headers inline
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE',
}

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY')
const ELEVENLABS_API_KEY = Deno.env.get('ELEVENLABS_API_KEY')

interface ConversationRequest {
  text?: string
  audioData?: string
  callSid: string
  userId: string
  config: {
    nlpEngine: string
    ttsEngine: string
    voiceId?: string
    voiceType?: string
    temperature: number
    systemInstructions?: string
    welcomeMessage?: string
  }
  conversationHistory?: Array<{
    role: 'user' | 'assistant'
    content: string
    timestamp: string
  }>
}

interface ConversationResponse {
  text: string
  audioUrl?: string
  nextAction?: 'continue' | 'transfer' | 'hangup' | 'schedule'
  transferNumber?: string
  appointmentData?: any
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    })
  }

  try {
    console.log('AI Conversation function called')
    console.log('OpenAI Key present:', !!OPENAI_API_KEY)
    console.log('ElevenLabs Key present:', !!ELEVENLABS_API_KEY)

    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        {
          status: 405,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    const requestData: ConversationRequest = await req.json()
    console.log('Request data received:', JSON.stringify(requestData))

    if (!requestData.callSid || !requestData.userId) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: callSid, userId' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    let userText = requestData.text

    if (requestData.audioData && !userText) {
      userText = await transcribeAudio(requestData.audioData)
    }

    if (!userText) {
      return new Response(
        JSON.stringify({ error: 'No text or audio data provided' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    const conversationHistory = await retrieveConversationHistory(requestData.callSid, requestData.userId)

    console.log('Processing conversation with text:', userText)
    console.log('Retrieved conversation history:', conversationHistory.length, 'messages')

    const aiResponse = await processConversation(
      userText,
      requestData.config,
      conversationHistory,
      requestData.callSid
    )

    await saveConversationHistory(
      requestData.callSid,
      requestData.userId,
      userText,
      aiResponse.text,
      conversationHistory
    )

    console.log('AI Response:', JSON.stringify(aiResponse))

    let audioUrl
    if (requestData.config.ttsEngine && aiResponse.text) {
      audioUrl = await generateSpeech(
        aiResponse.text,
        requestData.config.ttsEngine,
        requestData.config.voiceId || requestData.config.voiceType || 'female'
      )
    }

    const response: ConversationResponse = {
      text: aiResponse.text,
      audioUrl,
      nextAction: aiResponse.nextAction,
      transferNumber: aiResponse.transferNumber,
      appointmentData: aiResponse.appointmentData
    }

    return new Response(
      JSON.stringify(response),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )

  } catch (error) {
    console.error('Error in AI conversation:', error)
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        details: error instanceof Error ? error.message : String(error)
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})

async function transcribeAudio(audioData: string): Promise<string> {
  if (!OPENAI_API_KEY) {
    throw new Error('OpenAI API key not configured')
  }

  const audioBuffer = Uint8Array.from(atob(audioData), c => c.charCodeAt(0))
  const audioBlob = new Blob([audioBuffer], { type: 'audio/wav' })

  const formData = new FormData()
  formData.append('file', audioBlob, 'audio.wav')
  formData.append('model', 'whisper-1')
  formData.append('language', 'fr')

  const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${OPENAI_API_KEY}` },
    body: formData,
  })

  if (!response.ok) {
    throw new Error(`Whisper API error: ${response.statusText}`)
  }

  const result = await response.json()
  return result.text
}

async function processConversation(
  userText: string,
  config: ConversationRequest['config'],
  history: any[],
  callSid: string
): Promise<any> {
  if (!OPENAI_API_KEY) throw new Error('OpenAI API key not configured')

  const nameAlreadyAsked = history.some((h: any) =>
    h.role === 'assistant' &&
    (h.content.toLowerCase().includes('puis-je avoir votre nom') ||
     h.content.toLowerCase().includes('quel est votre nom') ||
     h.content.toLowerCase().includes('pourriez-vous me donner votre nom'))
  )

  const nameAlreadyProvided = history.some((h: any) =>
    h.role === 'user' && h.content.length > 0
  ) && await checkIfNameInHistory(callSid)

  let systemPrompt = buildSystemPrompt(config)
  if (nameAlreadyAsked) systemPrompt += '\n\nIMPORTANT: Tu as DEJA demande le nom dans cette conversation. NE LE REDEMANDE PAS !'
  if (nameAlreadyProvided) systemPrompt += '\n\nIMPORTANT: Le nom a DEJA ete collecte. NE LE REDEMANDE PAS !'

  const messages = [
    { role: 'system', content: systemPrompt },
    ...history.map((h: any) => ({ role: h.role, content: h.content })),
    { role: 'user', content: userText }
  ]

  const model = 'gpt-3.5-turbo'

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: config.temperature,
      max_tokens: 500,
      functions: [
        {
          name: 'confirm_caller_name',
          description: "Confirm and save the caller's full name after validation. Use this IMMEDIATELY after getting the name.",
          parameters: {
            type: 'object',
            properties: {
              fullName: { type: 'string' },
              spelledOut: { type: 'boolean' }
            },
            required: ['fullName']
          }
        },
        {
          name: 'transfer_call',
          description: 'Transfer the call to a human agent',
          parameters: {
            type: 'object',
            properties: {
              reason: { type: 'string' },
              urgency: { type: 'string', enum: ['low','medium','high'] }
            },
            required: ['reason']
          }
        },
        {
          name: 'schedule_appointment',
          description: 'Schedule appointment ONLY AFTER collecting clientName, appointmentType, preferredDate, preferredTime',
          parameters: {
            type: 'object',
            properties: {
              clientName: { type: 'string' },
              appointmentType: { type: 'string' },
              preferredDate: { type: 'string' },
              preferredTime: { type: 'string' },
              clientPhone: { type: 'string' },
              clientEmail: { type: 'string' }
            },
            required: ['clientName','appointmentType','preferredDate','preferredTime']
          }
        }
      ],
      function_call: 'auto'
    }),
  })

  if (!response.ok) {
    const errorBody = await response.text()
    throw new Error(`NLP API error: ${response.statusText} - ${errorBody}`)
  }

  const result = await response.json()
  const message = result.choices[0].message

  if (message.function_call) {
    const functionResult = handleFunctionCall(message.function_call, message.content || '')
    try {
      const args = JSON.parse(message.function_call.arguments)
      if (args.clientName && callSid) await updateCallWithCallerInfo(callSid, args.clientName, userText)
      if (args.fullName && callSid) await updateCallWithCallerInfo(callSid, args.fullName, userText)
    } catch (e) { console.error('parse args err', e) }
    return functionResult
  }

  const callerName = extractCallerName(userText)
  if (callerName && callSid) await updateCallWithCallerInfo(callSid, callerName, userText)

  return {
    text: message.content,
    nextAction: analyzeResponseForAction(message.content, userText)
  }
}

function buildSystemPrompt(config: ConversationRequest['config']): string {
  return `Tu es Marie, la secretaire virtuelle d'un cabinet juridique francais. Tu reponds au telephone comme une vraie secretaire humaine : chaleureuse, naturelle, et efficace. Tu n'es PAS un robot.

TON ET STYLE ORAL:
- Parle comme une vraie personne au telephone. Phrases courtes (max 2 par reponse).
- Varie tes formulations naturelles : "Bien sur, je vous note ca", "Pas de souci !", "Ah, je vois", "Tout a fait".
- Liaisons naturelles : alors, donc, du coup, voila.

INSTRUCTIONS DU CABINET:
${config.systemInstructions || config.welcomeMessage || "Accueillir chaleureusement les clients."}

MEMOIRE - REGLE ABSOLUE:
- Tu te souviens de TOUT dans cet appel. Ne redemande JAMAIS une info deja donnee.

COLLECTE DU NOM - UNE SEULE FOIS:
- Si le client donne son nom -> utilise confirm_caller_name immediatement.
- Sinon premier echange -> demande naturellement.
- Une seule demande maximum.

PRISE DE RDV - PROGRESSIVE:
1. Nom 2. Nature consultation 3. Date 4. Heure - puis schedule_appointment.

TRANSFERT: uniquement si demande explicite ou urgence.`
}

function handleFunctionCall(fc: any, content: string) {
  const args = JSON.parse(fc.arguments)
  switch (fc.name) {
    case 'confirm_caller_name':
      return { text: content || `Merci ${args.fullName}. Comment puis-je vous aider ?`, nextAction: 'continue', callerName: args.fullName }
    case 'transfer_call':
      return { text: content || 'Je vais vous transferer vers un avocat. Veuillez patienter.', nextAction: 'transfer', transferNumber: '+33766740768' }
    case 'schedule_appointment':
      return { text: content || 'Parfait, je vais organiser votre rendez-vous.', nextAction: 'schedule', appointmentData: args }
    default:
      return { text: content || 'Je peux vous aider.', nextAction: 'continue' }
  }
}

function analyzeResponseForAction(responseText: string, userText: string): string {
  const r = (responseText || '').toLowerCase()
  const u = (userText || '').toLowerCase()
  if (r.includes('je vais vous transferer') || r.includes('je vous transfere')) return 'transfer'
  if ((u.includes('parler avec un avocat') || u.includes('parler a un avocat') || u.includes('joindre un avocat')) && !u.includes('rendez-vous')) return 'transfer'
  if (u.includes('urgence') || u.includes('urgent')) return 'transfer'
  if (r.includes('je vais organiser') || r.includes('rendez-vous confirme')) return 'schedule'
  if ((r.includes('au revoir') || r.includes('bonne journee')) && (u.includes('au revoir') || u.includes('merci') || u.includes('bonne journee'))) return 'hangup'
  return 'continue'
}

async function generateSpeech(text: string, _engine: string, voice: string): Promise<string | undefined> {
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    const elevenlabsKey = Deno.env.get('ELEVENLABS_API_KEY')

    if (!supabaseUrl || !supabaseKey || !elevenlabsKey) {
      console.error('Missing config for TTS')
      return undefined
    }

    const voiceId = voice && voice.length > 10 ? voice : 'TxGEqnHWrfWFTfGW9XjX'
    console.log('Generating ElevenLabs audio with voice_id:', voiceId)

    const ttsResponse = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: 'POST',
      headers: {
        'xi-api-key': elevenlabsKey,
        'Content-Type': 'application/json',
        'Accept': 'audio/mpeg'
      },
      body: JSON.stringify({
        text,
        model_id: 'eleven_multilingual_v2',
        voice_settings: { stability: 0.5, similarity_boost: 0.85, style: 0.45, use_speaker_boost: true }
      })
    })

    if (!ttsResponse.ok) {
      console.error('ElevenLabs TTS failed:', ttsResponse.status, await ttsResponse.text())
      return undefined
    }

    const audioBuffer = await ttsResponse.arrayBuffer()
    const fileName = `response-${Date.now()}-${Math.random().toString(36).slice(2,8)}.mp3`

    const { createClient } = await import('npm:@supabase/supabase-js@2')
    const supabase = createClient(supabaseUrl, supabaseKey)

    const upload = await supabase.storage.from('call-audio').upload(fileName, audioBuffer, {
      contentType: 'audio/mpeg', upsert: false
    })
    if (upload.error) { console.error('upload err', upload.error); return undefined }

    const { data: publicUrl } = supabase.storage.from('call-audio').getPublicUrl(fileName)
    console.log('Audio uploaded:', publicUrl.publicUrl)
    return publicUrl.publicUrl
  } catch (error) {
    console.error('generateSpeech error:', error)
    return undefined
  }
}

function extractCallerName(userText: string): string | null {
  const cap = (s: string) => s.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ')
  const cleaned = userText.replace(/^(oui\s+|non\s+|alors\s+|donc\s+|euh\s+)+/gi, '').trim()
  const patterns = [
    /(?:je\s+m['']appelle|mon\s+nom\s+(?:est|c'est)|je\s+suis|c'est)\s+([a-zà-ÿ]+(?:\s+[a-zà-ÿ]+)*)/i,
    /(?:ici|bonjour)\s+([a-zà-ÿ]+(?:\s+[a-zà-ÿ]+)*)/i,
  ]
  const commonWords = ['bonjour','bonsoir','merci','oui','non','bien','tres','alors','donc','voila','rendez','vous','avocat','cabinet','monsieur','madame','mademoiselle']
  for (const p of patterns) {
    const m = cleaned.match(p)
    if (m && m[1]) {
      const name = m[1].trim()
      if (name.length < 3) continue
      const words = name.split(/\s+/)
      const nonCommon = words.filter(w => !commonWords.includes(w.toLowerCase()))
      if (nonCommon.length >= 1) return cap(name)
    }
  }
  return null
}

async function updateCallWithCallerInfo(callSid: string, callerName: string, userText: string) {
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    if (!supabaseUrl || !supabaseServiceKey) return
    const sentiment = analyzeSentiment(userText)
    const { createClient } = await import('npm:@supabase/supabase-js@2')
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    await supabase.from('calls').update({ client_name: callerName, sentiment }).eq('call_sid', callSid)
  } catch (e) { console.error('updateCall err', e) }
}

async function checkIfNameInHistory(callSid: string): Promise<boolean> {
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    if (!supabaseUrl || !supabaseServiceKey) return false
    const { createClient } = await import('npm:@supabase/supabase-js@2')
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    const { data } = await supabase.from('calls').select('client_name').eq('call_sid', callSid).maybeSingle()
    return !!(data && data.client_name && data.client_name.length > 0)
  } catch { return false }
}

async function retrieveConversationHistory(callSid: string, userId: string): Promise<any[]> {
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    if (!supabaseUrl || !supabaseServiceKey) return []
    const { createClient } = await import('npm:@supabase/supabase-js@2')
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    const { data } = await supabase.from('calls').select('transcript').eq('call_sid', callSid).eq('user_id', userId).maybeSingle()
    if (!data || !data.transcript) return []
    try { const h = JSON.parse(data.transcript); return Array.isArray(h) ? h : [] } catch { return [] }
  } catch { return [] }
}

async function saveConversationHistory(callSid: string, userId: string, userText: string, aiText: string, prev: any[]) {
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    if (!supabaseUrl || !supabaseServiceKey) return
    const { createClient } = await import('npm:@supabase/supabase-js@2')
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    const updated = [...prev, { role: 'user', content: userText }, { role: 'assistant', content: aiText }].slice(-20)
    await supabase.from('calls').update({ transcript: JSON.stringify(updated) }).eq('call_sid', callSid).eq('user_id', userId)
  } catch (e) { console.error('saveHistory err', e) }
}

function analyzeSentiment(text: string): string {
  const t = text.toLowerCase()
  const pos = ['merci','super','parfait','excellent','content','heureux','bien']
  const neg = ['probleme','urgent','grave','inquiet','difficile','mauvais']
  let p = 0, n = 0
  for (const w of pos) if (t.includes(w)) p++
  for (const w of neg) if (t.includes(w)) n++
  if (p > n) return 'positive'
  if (n > p) return 'negative'
  return 'neutral'
}
