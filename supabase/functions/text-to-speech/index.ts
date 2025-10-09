import { corsHeaders } from '../_shared/cors.ts'

const corsOptions = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

Deno.serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsOptions,
    });
  }

  try {
    const requestBody = await req.json();
    const { 
      text, 
      voice_id = "21m00Tcm4TlvDq8ikWAM", 
      tts_engine = "elevenlabs",
      voice_type = "female" 
    } = requestBody;

    if (!text) {
      return new Response(
        JSON.stringify({ error: "Text is required" }),
        {
          status: 400,
          headers: { ...corsOptions, "Content-Type": "application/json" },
        }
      );
    }

    console.log(`Using TTS engine: ${tts_engine}`);

    // Check if the requested engine is available, fallback to ElevenLabs if not
    const availableEngine = await getAvailableEngine(tts_engine);
    
    if (availableEngine !== tts_engine) {
      console.log(`Requested engine ${tts_engine} not available, falling back to ${availableEngine}`);
    }

    // Route to appropriate TTS service based on available engine
    switch (availableEngine) {
      case "google":
        return await handleGoogleTTS(text, voice_type);
      case "azure":
        return await handleAzureTTS(text, voice_type);
      case "elevenlabs":
      default:
        return await handleElevenLabsTTS(text, voice_id);
    }

  } catch (error) {
    console.error("Error in text-to-speech function:", error);
    return new Response(
      JSON.stringify({ error: `Internal server error: ${error.message}` }),
      {
        status: 500,
        headers: { ...corsOptions, "Content-Type": "application/json" },
      }
    );
  }
});

async function getAvailableEngine(requestedEngine: string): Promise<string> {
  // Check which engines have their API keys configured
  const elevenLabsKey = Deno.env.get("ELEVENLABS_API_KEY");
  const googleKey = Deno.env.get("GOOGLE_CLOUD_API_KEY");
  const azureKey = Deno.env.get("AZURE_SPEECH_KEY");
  const azureRegion = Deno.env.get("AZURE_SPEECH_REGION");

  // Priority order: requested engine first, then fallbacks
  const engines = [
    { name: "elevenlabs", available: !!elevenLabsKey },
    { name: "google", available: !!googleKey },
    { name: "azure", available: !!(azureKey && azureRegion) }
  ];

  // First try the requested engine if available
  if (requestedEngine && engines.find(e => e.name === requestedEngine)?.available) {
    return requestedEngine;
  }

  // Otherwise, return the first available engine
  const availableEngine = engines.find(e => e.available);
  return availableEngine?.name || "elevenlabs"; // Default fallback
}

async function handleElevenLabsTTS(text: string, voice_id: string) {
  const apiKey = Deno.env.get("ELEVENLABS_API_KEY");
  
  if (!apiKey) {
    return new Response(
      JSON.stringify({ 
        error: "ElevenLabs API key not configured. Please configure ELEVENLABS_API_KEY in Supabase secrets.",
        code: "API_KEY_MISSING"
      }),
      {
        status: 500,
        headers: { ...corsOptions, "Content-Type": "application/json" },
      }
    );
  }

  const elevenLabsRequestBody = {
    text,
    model_id: "eleven_multilingual_v2",
    voice_settings: {
      stability: 0.5,
      similarity_boost: 0.75,
      style: 0.0,
      use_speaker_boost: true
    }
  };

  const response = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${voice_id}`,
    {
      method: "POST",
      headers: {
        "Accept": "audio/mpeg",
        "Content-Type": "application/json",
        "xi-api-key": apiKey,
      },
      body: JSON.stringify(elevenLabsRequestBody),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    console.error("ElevenLabs API error:", errorText);
    
    return new Response(
      JSON.stringify({ error: `ElevenLabs API Error: ${errorText}` }),
      {
        status: response.status,
        headers: { ...corsOptions, "Content-Type": "application/json" },
      }
    );
  }

  const audioBuffer = await response.arrayBuffer();

  return new Response(audioBuffer, {
    status: 200,
    headers: {
      ...corsOptions,
      "Content-Type": "audio/mpeg",
      "Content-Length": audioBuffer.byteLength.toString(),
    },
  });
}

async function handleGoogleTTS(text: string, voice_type: string) {
  const apiKey = Deno.env.get("GOOGLE_CLOUD_API_KEY");
  
  if (!apiKey) {
    return new Response(
      JSON.stringify({ 
        error: "Google Cloud API key not configured. Please configure GOOGLE_CLOUD_API_KEY in Supabase secrets.",
        code: "API_KEY_MISSING"
      }),
      {
        status: 500,
        headers: { ...corsOptions, "Content-Type": "application/json" },
      }
    );
  }

  // Select voice based on voice_type
  const voiceName = voice_type === "male" ? "fr-FR-Standard-B" : "fr-FR-Standard-A";

  const requestBody = {
    input: { text },
    voice: {
      languageCode: "fr-FR",
      name: voiceName,
      ssmlGender: voice_type === "male" ? "MALE" : "FEMALE"
    },
    audioConfig: {
      audioEncoding: "MP3",
      speakingRate: 1.0,
      pitch: 0.0,
      volumeGainDb: 0.0
    }
  };

  const response = await fetch(
    `https://texttospeech.googleapis.com/v1/text:synthesize?key=${apiKey}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Google TTS API error:", errorText);
    
    return new Response(
      JSON.stringify({ error: `Google TTS API Error: ${errorText}` }),
      {
        status: response.status,
        headers: { ...corsOptions, "Content-Type": "application/json" },
      }
    );
  }

  const responseData = await response.json();
  
  if (!responseData.audioContent) {
    return new Response(
      JSON.stringify({ error: "No audio content received from Google TTS" }),
      {
        status: 500,
        headers: { ...corsOptions, "Content-Type": "application/json" },
      }
    );
  }

  // Decode base64 audio content
  const audioBuffer = Uint8Array.from(atob(responseData.audioContent), c => c.charCodeAt(0));

  return new Response(audioBuffer, {
    status: 200,
    headers: {
      ...corsOptions,
      "Content-Type": "audio/mpeg",
      "Content-Length": audioBuffer.byteLength.toString(),
    },
  });
}

async function handleAzureTTS(text: string, voice_type: string) {
  const speechKey = Deno.env.get("AZURE_SPEECH_KEY");
  const speechRegion = Deno.env.get("AZURE_SPEECH_REGION");
  
  if (!speechKey || !speechRegion) {
    return new Response(
      JSON.stringify({ 
        error: "Azure Speech key or region not configured. Please configure AZURE_SPEECH_KEY and AZURE_SPEECH_REGION in Supabase secrets.",
        code: "API_KEY_MISSING"
      }),
      {
        status: 500,
        headers: { ...corsOptions, "Content-Type": "application/json" },
      }
    );
  }

  // Select voice based on voice_type
  const voiceName = voice_type === "male" ? "fr-FR-HenriNeural" : "fr-FR-DeniseNeural";

  const ssml = `
    <speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="fr-FR">
      <voice name="${voiceName}">
        ${text}
      </voice>
    </speak>
  `;

  const response = await fetch(
    `https://${speechRegion}.tts.speech.microsoft.com/cognitiveservices/v1`,
    {
      method: "POST",
      headers: {
        "Ocp-Apim-Subscription-Key": speechKey,
        "Content-Type": "application/ssml+xml",
        "X-Microsoft-OutputFormat": "audio-16khz-128kbitrate-mono-mp3",
        "User-Agent": "MonSecretarIA-TTS"
      },
      body: ssml,
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`Azure TTS API error (Status: ${response.status}):`, errorText);
    
    return new Response(
      JSON.stringify({ error: `Azure TTS API Error (Status: ${response.status}): ${errorText}` }),
      {
        status: response.status,
        headers: { ...corsOptions, "Content-Type": "application/json" },
      }
    );
  }

  const audioBuffer = await response.arrayBuffer();

  return new Response(audioBuffer, {
    status: 200,
    headers: {
      ...corsOptions,
      "Content-Type": "audio/mpeg",
      "Content-Length": audioBuffer.byteLength.toString(),
    },
  });
}