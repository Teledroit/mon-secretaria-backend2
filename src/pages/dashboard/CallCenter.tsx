import { useState, useEffect } from 'react';
import { Phone, Mic, PhoneOff, AlertCircle, Play, Pause, Volume2 } from 'lucide-react';
import Button from '@/components/ui/Button';
import { useAuth } from '@/lib/AuthContext';
import CallFilters from '@/components/dashboard/calls/CallFilters';
import CallList from '@/components/dashboard/calls/CallList';
import { supabase } from '@/lib/supabase';

interface CallDetails {
  id: string;
  transcription: string;
  aiResponses: string[];
  sentiment: string;
  duration: string;
  cost: number;
}

export default function CallCenter() {
  const [isInCall, setIsInCall] = useState(false);
  const [currentCallSid, setCurrentCallSid] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [transcription, setTranscription] = useState<string[]>([]);
  const [aiResponses, setAiResponses] = useState<string[]>([]);
  const [selectedCallDetails, setSelectedCallDetails] = useState<CallDetails | null>(null);
  const [showCallDetails, setShowCallDetails] = useState(false);
  const [monthlyCallCount, setMonthlyCallCount] = useState(0);
  const [isLimitReached, setIsLimitReached] = useState(false);
  const [subscription, setSubscription] = useState<any>(null);
  const [calls, setCalls] = useState<any[]>([]);
  const [filters, setFilters] = useState({});
  const [sortField, setSortField] = useState('start_time');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [callConfig, setCallConfig] = useState<any>(null);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [audioStream, setAudioStream] = useState<MediaStream | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    fetchCalls();
    subscribeToCallUpdates();
    checkSubscriptionAndCallCount();
    loadCallConfiguration();
  }, [filters, sortField, sortDirection]);

  const loadCallConfiguration = async () => {
    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser) return;

      const { data: config } = await supabase
        .from('configurations')
        .select('*')
        .eq('user_id', currentUser.id)
        .single();

      if (config) {
        setCallConfig({
          ttsEngine: config.tts_engine || 'elevenlabs',
          nlpEngine: config.nlp_engine || 'gpt4',
          voiceId: config.voice_id || 'EXAVITQu4vr4xnSDxMaL',
          voiceType: config.voice_type || 'female',
          temperature: config.temperature || 0.7,
          systemInstructions: config.system_instructions,
          welcomeMessage: config.welcome_message,
          latency: config.latency || 0.5,
          interruptionSensitivity: config.interruption_sensitivity || 0.7,
          enableBackchanneling: config.enable_backchanneling ?? true,
          enableSpeechNormalization: config.enable_speech_normalization ?? true
        });
      }
    } catch (error) {
      console.error('Error loading call configuration:', error);
    }
  };
  const checkSubscriptionAndCallCount = async () => {
    if (!user) return;

    // Get user's subscription
    const { data: subData } = await supabase
      .from('stripe_user_subscriptions')
      .select('*')
      .maybeSingle();

    setSubscription(subData);

    // Get current month's call count
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const { data: callsData } = await supabase
      .from('calls')
      .select('count', { count: 'exact' })
      .gte('start_time', startOfMonth.toISOString());

    const count = callsData?.length || 0;
    setMonthlyCallCount(count);
    
    // Check if limit reached for Avocat TEST plan
    if (subData?.price_id === 'price_1RLQL4HCmF7qRHmmOjAvQVgi' && count >= 50) {
      setIsLimitReached(true);
    }
  };

  const fetchCalls = async () => {
    let query = supabase
      .from('calls')
      .select(`
        *,
        transcriptions (
          timestamp,
          speaker,
          content,
          sentiment
        )
      `)
      .order(sortField, { ascending: sortDirection === 'asc' });

    // Appliquer les filtres
    Object.entries(filters).forEach(([key, value]) => {
      if (value) {
        query = query.eq(key, value);
      }
    });

    const { data, error } = await query;
    if (error) {
      console.error('Error fetching calls:', error);
    } else {
      setCalls(data || []);
    }
  };

  const subscribeToCallUpdates = () => {
    const subscription = supabase
      .channel('calls')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'calls'
      }, () => {
        fetchCalls();
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  };

  const handleCall = async () => {
    if (isLimitReached) {
      alert('Vous avez atteint votre limite de 50 appels ce mois-ci. Veuillez passer à l\'offre Cabinet COMPLET pour des appels illimités.');
      return;
    }

    try {
      // Initialize audio stream
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });
      setAudioStream(stream);
      
      // Setup media recorder
      const recorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });
      setMediaRecorder(recorder);
      
      const audioChunks: BlobPart[] = [];
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunks.push(event.data);
        }
      };
      
      recorder.onstop = async () => {
        if (audioChunks.length > 0) {
          const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
          await processAudioInput(audioBlob);
          audioChunks.length = 0;
        }
      };
    } catch (error) {
      console.error('Error accessing microphone:', error);
      alert('Impossible d\'accéder au microphone. Veuillez autoriser l\'accès.');
      return;
    }
    setIsInCall(true);
    setTranscription([]);
    setAiResponses([]);
    const callSid = `call_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    setCurrentCallSid(callSid);
    
    // Créer un nouvel enregistrement d'appel
    const { data, error } = await supabase
      .from('calls')
      .insert({
        id: callSid,
        start_time: new Date().toISOString(),
        status: 'in-progress',
        phone_number: '+33123456789', // Exemple
        user_id: user?.id
      })
      .select()
      .single();

    if (error) {
      console.error('Error starting call:', error);
    }
  };

  const handleHangup = async () => {
    // Stop audio stream
    if (audioStream) {
      audioStream.getTracks().forEach(track => track.stop());
      setAudioStream(null);
    }
    setMediaRecorder(null);
    setIsRecording(false);
    
    setIsInCall(false);
    setCurrentCallSid(null);
    
    // Mettre à jour l'appel en cours
    const { error } = await supabase
      .from('calls')
      .update({
        end_time: new Date().toISOString(),
        status: 'completed'
      })
      .eq('id', currentCallSid);

    if (error) {
      console.error('Error ending call:', error);
    }
  };

  const processAudioInput = async (audioBlob: Blob) => {
    if (!callConfig || !currentCallSid) return;

    try {
      // Convert audio to base64
      const arrayBuffer = await audioBlob.arrayBuffer();
      const base64Audio = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));

      // Call AI conversation function
      const { data: { session } } = await supabase.auth.getSession();
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-conversation`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({
          audioData: base64Audio,
          callSid: currentCallSid,
          userId: user?.id,
          config: callConfig,
          conversationHistory: []
        })
      });

      if (!response.ok) {
        throw new Error('AI conversation failed');
      }

      const aiResponse = await response.json();
      
      // Update transcription and AI responses
      setTranscription(prev => [...prev, '[Audio transcrit]']);
      setAiResponses(prev => [...prev, aiResponse.text]);

      // Play AI response if audio is available
      if (aiResponse.audioUrl) {
        await playAIResponse(aiResponse.audioUrl);
      }

    } catch (error) {
      console.error('Error processing audio:', error);
    }
  };

  const playAIResponse = async (audioUrl: string) => {
    try {
      let audioBlob: Blob;
      
      if (audioUrl.startsWith('data:audio')) {
        const base64Data = audioUrl.split(',')[1];
        const binaryData = atob(base64Data);
        const arrayBuffer = new ArrayBuffer(binaryData.length);
        const uint8Array = new Uint8Array(arrayBuffer);
        
        for (let i = 0; i < binaryData.length; i++) {
          uint8Array[i] = binaryData.charCodeAt(i);
        }
        
        audioBlob = new Blob([arrayBuffer], { type: 'audio/mpeg' });
      } else {
        const response = await fetch(audioUrl);
        audioBlob = await response.blob();
      }

      const audio = new Audio(URL.createObjectURL(audioBlob));
      await audio.play();

    } catch (error) {
      console.error('Error playing AI response:', error);
    }
  };

  const startRecording = () => {
    if (mediaRecorder && !isRecording) {
      mediaRecorder.start();
      setIsRecording(true);
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop();
      setIsRecording(false);
    }
  };

  const handleToggleMute = () => {
    if (audioStream) {
      audioStream.getAudioTracks().forEach(track => {
        track.enabled = isMuted;
      });
    }
    setIsMuted(!isMuted);
  };

  const handleFilterChange = (newFilters: Record<string, any>) => {
    setFilters({ ...filters, ...newFilters });
  };

  const handleSort = (field: string) => {
    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleViewDetails = async (id: string) => {
    try {
      const { data: call, error } = await supabase
        .from('calls')
        .select(`
          *,
          transcriptions (
            content,
            sentiment
          )
        `)
        .eq('id', id)
        .single();

      if (error) throw error;

      const details: CallDetails = {
        id: call.id,
        transcription: call.transcriptions?.map(t => t.content).join('\n') || 'Pas de transcription',
        aiResponses: ['Réponse IA simulée'], // À remplacer par les vraies réponses
        sentiment: call.transcriptions?.[0]?.sentiment || 'neutral',
        duration: call.duration || '0:00',
        cost: call.cost || 0
      };

      setSelectedCallDetails(details);
      setShowCallDetails(true);
    } catch (error) {
      console.error('Error fetching call details:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-gray-900">Centre d'Appels</h1>
        <div className="flex items-center space-x-2">
          {subscription?.price_id === 'price_1RLQL4HCmF7qRHmmOjAvQVgi' && (
            <div className="text-sm text-gray-600 mr-4">
              Appels ce mois : {monthlyCallCount}/50
              {isLimitReached && (
                <div className="flex items-center text-red-600 mt-1">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  Limite atteinte
                </div>
              )}
            </div>
          )}
          <div className={`w-3 h-3 rounded-full ${isInCall ? 'bg-green-500' : 'bg-gray-500'}`} />
          <span className="text-sm text-gray-600">
            {isInCall ? 'En appel' : 'En attente'}
          </span>
        </div>
      </div>

      {/* Real-time Call Interface */}
      {isInCall ? (
        <div className="space-y-6">
          {/* Call Controls */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex justify-center items-center space-x-4 mb-6">
              <Button
                onClick={handleToggleMute}
                className={`w-12 h-12 rounded-full ${isMuted ? 'bg-red-500 hover:bg-red-600' : 'bg-blue-500 hover:bg-blue-600'}`}
              >
                {isMuted ? <Mic className="w-6 h-6 text-white" /> : <Mic className="w-6 h-6 text-white" />}
              </Button>

              <Button
                onClick={isRecording ? stopRecording : startRecording}
                className={`w-16 h-16 rounded-full ${
                  isRecording 
                    ? 'bg-red-500 hover:bg-red-600 animate-pulse' 
                    : 'bg-green-500 hover:bg-green-600'
                }`}
              >
                <Mic className="w-8 h-8 text-white" />
              </Button>

              <Button
                onClick={handleHangup}
                className="w-12 h-12 rounded-full bg-red-500 hover:bg-red-600"
              >
                <PhoneOff className="w-6 h-6 text-white" />
              </Button>
            </div>

            <div className="text-center">
              <div className="flex items-center justify-center space-x-2">
                <div className={`w-3 h-3 rounded-full ${isRecording ? 'bg-red-500 animate-pulse' : 'bg-gray-300'}`} />
                <span className="text-sm text-gray-600">
                  {isRecording ? 'Enregistrement...' : 'En attente'}
                </span>
              </div>
            </div>
          </div>

          {/* Real-time Transcription */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <h3 className="font-semibold mb-4 flex items-center">
                <Mic className="w-5 h-5 mr-2 text-blue-600" />
                Transcription Client
              </h3>
              <div className="h-64 overflow-y-auto bg-gray-50 rounded p-4 space-y-2">
                {transcription.length > 0 ? (
                  transcription.map((text, index) => (
                    <div key={index} className="p-2 bg-blue-50 rounded text-sm">
                      <span className="text-blue-800">{text}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-center py-8">En attente de la conversation...</p>
                )}
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <h3 className="font-semibold mb-4 flex items-center">
                <Volume2 className="w-5 h-5 mr-2 text-green-600" />
                Réponses IA
              </h3>
              <div className="h-64 overflow-y-auto bg-gray-50 rounded p-4 space-y-2">
                {aiResponses.length > 0 ? (
                  aiResponses.map((response, index) => (
                    <div key={index} className="p-2 bg-green-50 rounded text-sm">
                      <span className="text-green-800">{response}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-center py-8">L'IA est prête à répondre...</p>
                )}
              </div>
            </div>
          </div>

          {/* Call Statistics */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <h3 className="font-semibold mb-4">Statistiques de l'appel en cours</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600">{transcription.length}</p>
                <p className="text-sm text-gray-600">Messages client</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">{aiResponses.length}</p>
                <p className="text-sm text-gray-600">Réponses IA</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-purple-600">
                  {callConfig?.temperature || 0.7}
                </p>
                <p className="text-sm text-gray-600">Température IA</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-orange-600">
                  {callConfig?.latency || 0.5}s
                </p>
                <p className="text-sm text-gray-600">Latence</p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="text-center">
            <Button
              onClick={handleCall}
              disabled={!callConfig}
              className="w-16 h-16 rounded-full bg-green-500 hover:bg-green-600"
            >
              <Phone className="w-8 h-8 text-white" />
            </Button>
            <p className="mt-4 text-gray-600">
              {!callConfig ? 'Chargement de la configuration...' : 'Cliquez pour démarrer un appel de test'}
            </p>
          </div>
        </div>
      )}

      {/* Call Details Modal */}
      {showCallDetails && selectedCallDetails && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold">Détails de l'appel</h2>
                <Button
                  variant="outline"
                  onClick={() => setShowCallDetails(false)}
                >
                  Fermer
                </Button>
              </div>
            </div>
            
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <p className="text-2xl font-bold text-blue-600">{selectedCallDetails.duration}</p>
                  <p className="text-sm text-gray-600">Durée</p>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <p className="text-2xl font-bold text-green-600">{selectedCallDetails.cost}€</p>
                  <p className="text-sm text-gray-600">Coût</p>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <p className="text-2xl font-bold text-purple-600">{selectedCallDetails.sentiment}</p>
                  <p className="text-sm text-gray-600">Sentiment</p>
                </div>
              </div>
              
              <div>
                <h3 className="font-semibold mb-3">Transcription complète</h3>
                <div className="bg-gray-50 rounded-lg p-4 max-h-64 overflow-y-auto">
                  <pre className="whitespace-pre-wrap text-sm text-gray-700">
                    {selectedCallDetails.transcription}
                  </pre>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <CallFilters onFilterChange={handleFilterChange} />
      
      <CallList
        calls={calls}
        onSort={handleSort}
        onViewDetails={handleViewDetails}
      />
    </div>
  );
}