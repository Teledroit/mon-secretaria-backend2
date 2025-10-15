import { useState, useEffect } from 'react';
import { Brain, Cpu, AlertCircle } from 'lucide-react';
import Button from '@/components/ui/Button';
import { supabase } from '@/lib/supabase';

interface AIConfigurationProps {
  onSave: (data: any) => void;
  initialConfig?: {
    ttsEngine?: string;
    nlpEngine?: string;
    voice?: string;
    temperature?: number;
    systemInstructions?: string;
  };
}

export default function AIConfiguration({ onSave, initialConfig }: AIConfigurationProps) {
  const [prompt, setPrompt] = useState('');
  const [systemInstructions, setSystemInstructions] = useState('');
  const [temperature, setTemperature] = useState(0.7);
  const [ttsEngine, setTTSEngine] = useState('elevenlabs');
  const [nlpEngine, setNLPEngine] = useState('gpt4');
  const [voiceId, setVoiceId] = useState('EXAVITQu4vr4xnSDxMaL');
  const [isPlaying, setIsPlaying] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [demoSettings, setDemoSettings] = useState({
    latency: 0.5,
    interruptionSensitivity: 0.7,
    enableBackchanneling: true,
    enableSpeechNormalization: true,
    voiceType: 'female'
  });
  const [demoText, setDemoText] = useState("Bonjour, je suis votre assistant virtuel. Comment puis-je vous aider ?");
  const [retryCount, setRetryCount] = useState(0);
  const MAX_RETRIES = 3;
  const RETRY_DELAY = 1000;

  // Utiliser exactement les mêmes voix que dans la démo de l'accueil (VoiceTab.tsx)
  const ELEVENLABS_VOICES = {
    'female-professional': {
      id: 'EXAVITQu4vr4xnSDxMaL',
      name: 'Femme - Professionnelle (25-35 ans)'
    },
    'male-professional': {
      id: 'ThT5KcBeYPX3keUQqHPh',
      name: 'Femme - Professionnel (30-40 ans)'
    },
    'female-dynamic': {
      id: 'AZnzlk1XvdvUeBnXmlld',
      name: 'Femme - Dynamique (20-30 ans)'
    },
    'male-mature': {
      id: 'VR6AewLTigWG4xSOukaG',
      name: 'Homme - Posé (40-50 ans)'
    }
  };

  // Load initial configuration ONLY on component mount
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    if (initialConfig && !isInitialized) {
      // Force ElevenLabs if user had Google or Azure configured
      const engineToUse = (initialConfig.ttsEngine === 'google' || initialConfig.ttsEngine === 'azure')
        ? 'elevenlabs'
        : initialConfig.ttsEngine;

      if (initialConfig.ttsEngine) setTTSEngine(engineToUse);
      if (initialConfig.nlpEngine) setNLPEngine(initialConfig.nlpEngine);
      if (initialConfig.voice) setVoiceId(initialConfig.voice);
      if (initialConfig.temperature !== undefined) setTemperature(initialConfig.temperature);
      // Only set system instructions if they exist and are not the default welcome message
      if (initialConfig.systemInstructions &&
          !initialConfig.systemInstructions.includes("Bonjour, vous êtes en communication avec l'assistant virtuel du cabinet")) {
        setSystemInstructions(initialConfig.systemInstructions);
        // Update demo text if we have custom system instructions
        setDemoText(initialConfig.systemInstructions);
      }

      setIsInitialized(true);
    }
  }, [initialConfig, isInitialized]);

  const handleSave = async () => {
    try {
      await onSave({
        prompt,
        systemInstructions,
        temperature,
        ttsEngine,
        nlpEngine,
        voiceId
      });
      alert('Configuration IA sauvegardée avec succès !');
    } catch (error) {
      console.error('Error saving AI config:', error);
      alert('Erreur lors de la sauvegarde de la configuration IA');
    }
  };

  const playDemo = async () => {
    setError(null);
    setIsPlaying(true);
    
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.access_token) {
      setError('Not authenticated');
      setIsPlaying(false);
      return;
    }

    if (!import.meta.env.VITE_SUPABASE_URL) {
      setError('Supabase URL not configured');
      setIsPlaying(false);
      return;
    }

    try {
      // Prepare request body based on TTS engine
      const requestBody: any = {
        text: demoText,
        tts_engine: ttsEngine
      };

      // Add engine-specific parameters
      if (ttsEngine === 'elevenlabs') {
        requestBody.voice_id = voiceId;
      } else {
        // For Google and Azure, use voice type preference
        requestBody.voice_type = demoSettings.voiceType;
      }

      console.log('Sending TTS request:', requestBody);

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/text-to-speech`, {
        method: 'POST',
        mode: 'cors',
        credentials: 'omit',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: response.statusText }));
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('audio')) {
        throw new Error('Invalid response format - expected audio');
      }

      const audioBlob = await response.blob();
      if (audioBlob.size === 0) {
        throw new Error('Received empty audio response');
      }

      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
    
      audio.onerror = () => {
        setError('Failed to play audio - invalid audio format');
        setIsPlaying(false);
        URL.revokeObjectURL(audioUrl);
      };

      audio.onended = () => {
        setIsPlaying(false);
        URL.revokeObjectURL(audioUrl);
      };

      await audio.play();
    } catch (error: any) {
      console.error('Error playing audio:', error);
      let errorMessage = 'Failed to generate or play audio';
      
      if (error.message.includes('Failed to fetch')) {
        errorMessage = 'Network error - please check your connection and try again';
      } else if (error.message.includes('not configured')) {
        errorMessage = 'Service not properly configured - please contact support';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setError(errorMessage);
      setIsPlaying(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
      <div className="flex items-center gap-2 mb-6">
        <Brain className="w-5 h-5 text-blue-600" />
        <h2 className="text-lg font-medium">Configuration de l'IA</h2>
      </div>

      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Moteur de synthèse vocale
            </label>
            <select
              value={ttsEngine}
              onChange={(e) => setTTSEngine(e.target.value)}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="elevenlabs">ElevenLabs</option>
              <option value="google" disabled>Google Text-to-Speech (Bientôt disponible)</option>
              <option value="azure" disabled>Azure Speech Services (Bientôt disponible)</option>
            </select>
            <p className="mt-1 text-sm text-gray-500">
              Sélectionnez le moteur de synthèse vocale à utiliser
            </p>
            {ttsEngine === 'elevenlabs' && (
              <>
                <p className="mt-2 font-medium text-gray-700">Voix ElevenLabs</p>
                <select
                  value={voiceId}
                  onChange={(e) => setVoiceId(e.target.value)}
                  className="mt-2 w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  {Object.entries(ELEVENLABS_VOICES).map(([key, voice]) => (
                    <option key={key} value={voice.id}>{voice.name}</option>
                  ))}
                </select>
              </>
            )}
            {(ttsEngine === 'google' || ttsEngine === 'azure') && (
              <>
                <p className="mt-2 font-medium text-gray-700">Type de voix</p>
                <select
                  value={demoSettings.voiceType}
                  onChange={(e) => setDemoSettings({
                    ...demoSettings,
                    voiceType: e.target.value as 'female' | 'male'
                  })}
                  className="mt-2 w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  <option value="female">Femme</option>
                  <option value="male">Homme</option>
                </select>
                <p className="mt-1 text-xs text-gray-400">
                  {ttsEngine === 'google' && 'Utilise les voix fr-FR-Standard-A (femme) / fr-FR-Standard-B (homme)'}
                  {ttsEngine === 'azure' && 'Utilise les voix fr-FR-DeniseNeural (femme) / fr-FR-HenriNeural (homme)'}
                </p>
              </>
            )}
          </div>
          
          {(ttsEngine === 'google' || ttsEngine === 'azure') && (
            <div className="bg-yellow-50 p-3 rounded-lg flex items-center gap-2 mt-4">
              <AlertCircle className="w-5 h-5 text-yellow-600" />
              <p className="text-sm text-yellow-800">
                Ce moteur est en cours de développement et sera bientôt disponible.
                Pour le moment, veuillez utiliser ElevenLabs.
              </p>
            </div>
          )}




          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Moteur de traitement du langage
            </label>
            <select
              value={nlpEngine}
              onChange={(e) => setNLPEngine(e.target.value)}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="gpt4">GPT-4</option>
              <option value="gpt35">GPT-3.5 Turbo</option>
              <option value="claude">Claude 2</option>
            </select>
            <p className="mt-1 text-sm text-gray-500">
              Choisissez le modèle qui analysera et répondra aux conversations
            </p>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Instructions système générales
          </label>
          <textarea
            value={systemInstructions}
            onChange={(e) => setSystemInstructions(e.target.value)}
            rows={4}
            placeholder="Définissez le rôle fondamental et le comportement général de l'assistant..."
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
          <p className="mt-1 text-sm text-gray-500">
            Ces instructions définissent l'identité et le cadre global de l'assistant
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Instructions spécifiques
          </label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={3}
            placeholder="Instructions détaillées pour des situations ou cas particuliers..."
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
          <p className="mt-1 text-sm text-gray-500">
            Ces instructions affinent le comportement de l'IA pour des contextes spécifiques
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Température (créativité)
          </label>
          <div className="flex items-center gap-4">
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={temperature}
              onChange={(e) => setTemperature(parseFloat(e.target.value))}
              className="w-full"
            />
            <span className="text-sm text-gray-600 w-12">{temperature}</span>
          </div>
          <p className="mt-1 text-sm text-gray-500">
            Une valeur plus élevée rend les réponses plus créatives mais moins prévisibles
          </p>
        </div>

        <div className="bg-gray-50 p-6 rounded-lg space-y-4">
          <h3 className="font-medium text-gray-900">Tester la configuration</h3>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Texte de test
            </label>
            <textarea
              value={demoText}
              onChange={(e) => setDemoText(e.target.value)}
              rows={2}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
          {error && (
            <div className="text-red-600 text-sm bg-red-50 p-3 rounded border border-red-200">
              <div className="font-medium">Erreur:</div>
              <div>{error}</div>
            </div>
          )}
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              <div>Moteur : {ttsEngine === 'google' ? 'Google TTS' : ttsEngine === 'elevenlabs' ? 'ElevenLabs' : 'Azure Speech'}</div>
              {ttsEngine === 'elevenlabs' && (
                <div className="text-xs text-gray-500">
                  Voix : {Object.values(ELEVENLABS_VOICES).find(v => v.id === voiceId)?.name}
                </div>
              )}
              {ttsEngine !== 'elevenlabs' && (
                <div className="text-xs text-gray-500">
                  Type de voix : {demoSettings.voiceType === 'male' ? 'Homme' : 'Femme'}
                </div>
              )}
            </div>
            <div className="flex gap-2">
              <Button
                onClick={playDemo}
                disabled={isPlaying || isRecording || !demoText.trim() || ttsEngine === 'google' || ttsEngine === 'azure'}
                variant="outline"
              >
                {isPlaying ? 'Lecture en cours...' : 'Écouter la démo'}
              </Button>
              <Button
                onClick={async () => {
                  if (isRecording) {
                    mediaRecorder?.stop();
                    setIsRecording(false);
                    return;
                  }

                  try {
                    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                    const recorder = new MediaRecorder(stream);
                    setMediaRecorder(recorder);

                    const chunks: BlobPart[] = [];
                    recorder.ondataavailable = (e) => chunks.push(e.data);
                    recorder.onstop = async () => {
                      const audioBlob = new Blob(chunks, { type: 'audio/webm' });
                      
                      const formData = new FormData();
                      formData.append('audio', audioBlob);
                      formData.append('config', JSON.stringify({
                        nlpEngine,
                        temperature,
                        systemInstructions,
                        ttsEngine,
                        voice: ttsEngine === 'elevenlabs' ? voiceId : demoSettings.voiceType,
                        latency: demoSettings.latency,
                        interruptionSensitivity: demoSettings.interruptionSensitivity,
                        enableBackchanneling: demoSettings.enableBackchanneling,
                        enableSpeechNormalization: demoSettings.enableSpeechNormalization
                      }));

                      try {
                        const { data: { session } } = await supabase.auth.getSession();
                        const response = await fetch(
                          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/process-voice-input`,
                          {
                            method: 'POST',
                            headers: {
                              'Authorization': `Bearer ${session?.access_token || import.meta.env.VITE_SUPABASE_ANON_KEY}`,
                            },
                            body: formData
                          }
                        );

                        if (!response.ok) {
                          const errorData = await response.json().catch(() => ({ error: response.statusText }));
                          throw new Error(errorData.error || 'Échec du traitement de l\'entrée vocale');
                        }

                        const audioResponse = await response.blob();
                        const audioUrl = URL.createObjectURL(audioResponse);
                        const audio = new Audio(audioUrl);
                        
                        audio.onended = () => {
                          URL.revokeObjectURL(audioUrl);
                          stream.getTracks().forEach(track => track.stop());
                        };

                        await audio.play();
                      } catch (error) {
                        console.error('Erreur de traitement vocal:', error);
                        setError(error instanceof Error ? error.message : 'Échec du traitement de l\'entrée vocale');
                        stream.getTracks().forEach(track => track.stop());
                      }
                    };

                    recorder.start();
                    setIsRecording(true);
                    setError(null);
                  } catch (error) {
                    console.error('Erreur d\'enregistrement audio:', error);
                    setError(error instanceof Error ? error.message : 'Échec du démarrage de l\'enregistrement');
                    setIsRecording(false);
                  }
                }}
                disabled={isPlaying || ttsEngine === 'google' || ttsEngine === 'azure'}
                variant={isRecording ? "primary" : "outline"}
                className={isRecording ? "bg-red-500 hover:bg-red-600" : ""}
              >
                {isRecording ? 'Arrêter' : 'Parler'}
              </Button>
            </div>
          </div>
          <div className="mt-2 text-sm text-gray-500">
            Cliquez sur "Parler" pour tester la configuration avec votre voix
          </div>
        </div>

        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Cpu className="w-4 h-4 text-blue-600" />
            <h3 className="font-medium text-blue-900">Consommation estimée (par minute)</h3>
          </div>
          <p className="text-sm text-blue-800">
            GPT-4 : ~0.03€/minute<br />
            ElevenLabs : ~0.02€/minute<br />
            Google TTS : Bientôt disponible<br />
            Azure TTS : Bientôt disponible
          </p>
        </div>

        <Button onClick={handleSave} className="w-full">
          Sauvegarder la configuration IA
        </Button>
      </div>
    </div>
  );
}
