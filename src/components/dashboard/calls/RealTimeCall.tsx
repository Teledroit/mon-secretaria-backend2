import { useState, useEffect, useRef } from 'react';
import { Phone, Mic, MicOff, PhoneOff, Volume2, VolumeX } from 'lucide-react';
import Button from '@/components/ui/Button';
import { ConversationManager } from '@/lib/ai-conversation';
import { VoiceProcessor } from '@/lib/voice-processing';
import { useAuth } from '@/lib/AuthContext';

interface RealTimeCallProps {
  callSid: string;
  onCallEnd: () => void;
  config: any;
}

export default function RealTimeCall({ callSid, onCallEnd, config }: RealTimeCallProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isAISpeaking, setIsAISpeaking] = useState(false);
  const [transcription, setTranscription] = useState<string[]>([]);
  const [aiResponses, setAiResponses] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioStreamRef = useRef<MediaStream | null>(null);
  const conversationManagerRef = useRef<ConversationManager | null>(null);
  const voiceProcessorRef = useRef<VoiceProcessor | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      conversationManagerRef.current = new ConversationManager(callSid, user.id, config);
      voiceProcessorRef.current = new VoiceProcessor(config);
      initializeAudioStream();
    }

    return () => {
      cleanup();
    };
  }, [callSid, user, config]);

  const initializeAudioStream = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });
      
      audioStreamRef.current = stream;
      setupMediaRecorder(stream);
    } catch (error) {
      console.error('Error accessing microphone:', error);
      setError('Impossible d\'accéder au microphone. Veuillez autoriser l\'accès.');
    }
  };

  const setupMediaRecorder = (stream: MediaStream) => {
    const mediaRecorder = new MediaRecorder(stream, {
      mimeType: 'audio/webm;codecs=opus'
    });

    const audioChunks: BlobPart[] = [];

    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        audioChunks.push(event.data);
      }
    };

    mediaRecorder.onstop = async () => {
      if (audioChunks.length > 0) {
        const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
        await processAudioInput(audioBlob);
        audioChunks.length = 0; // Clear chunks
      }
    };

    mediaRecorderRef.current = mediaRecorder;
  };

  const processAudioInput = async (audioBlob: Blob) => {
    if (!conversationManagerRef.current) return;

    try {
      setError(null);
      
      // Process the audio and get AI response
      const aiResponse = await conversationManagerRef.current.processUserInput(audioBlob);
      
      // Add transcription (we'll need to get this from the AI response)
      setTranscription(prev => [...prev, '[Audio transcrit]']);
      
      // Add AI response
      setAiResponses(prev => [...prev, aiResponse.text]);

      // Handle next action
      await handleNextAction(aiResponse);

      // Play AI response if audio is available
      if (aiResponse.audioUrl) {
        await playAIResponse(aiResponse.audioUrl);
      }

    } catch (error) {
      console.error('Error processing audio:', error);
      setError('Erreur lors du traitement de l\'audio');
    }
  };

  const handleNextAction = async (aiResponse: any) => {
    switch (aiResponse.nextAction) {
      case 'transfer':
        // Handle call transfer
        console.log('Transferring call to:', aiResponse.transferNumber);
        // In a real implementation, this would trigger a Twilio transfer
        break;
        
      case 'schedule':
        // Handle appointment scheduling
        console.log('Scheduling appointment:', aiResponse.appointmentData);
        // This would create an appointment in the database
        break;
        
      case 'hangup':
        // End the call
        onCallEnd();
        break;
        
      default:
        // Continue conversation
        break;
    }
  };

  const playAIResponse = async (audioUrl: string) => {
    try {
      setIsAISpeaking(true);
      
      let audioBlob: Blob;
      
      if (audioUrl.startsWith('data:audio')) {
        // Handle base64 data URL
        const base64Data = audioUrl.split(',')[1];
        const binaryData = atob(base64Data);
        const arrayBuffer = new ArrayBuffer(binaryData.length);
        const uint8Array = new Uint8Array(arrayBuffer);
        
        for (let i = 0; i < binaryData.length; i++) {
          uint8Array[i] = binaryData.charCodeAt(i);
        }
        
        audioBlob = new Blob([arrayBuffer], { type: 'audio/mpeg' });
      } else {
        // Handle regular URL
        const response = await fetch(audioUrl);
        audioBlob = await response.blob();
      }

      const audio = new Audio(URL.createObjectURL(audioBlob));
      
      audio.onended = () => {
        setIsAISpeaking(false);
        URL.revokeObjectURL(audio.src);
      };

      audio.onerror = () => {
        setIsAISpeaking(false);
        setError('Erreur lors de la lecture de la réponse audio');
      };

      await audio.play();

    } catch (error) {
      console.error('Error playing AI response:', error);
      setIsAISpeaking(false);
      setError('Impossible de lire la réponse audio');
    }
  };

  const startRecording = () => {
    if (mediaRecorderRef.current && !isRecording) {
      mediaRecorderRef.current.start();
      setIsRecording(true);
      setError(null);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const toggleMute = () => {
    if (audioStreamRef.current) {
      audioStreamRef.current.getAudioTracks().forEach(track => {
        track.enabled = isMuted;
      });
      setIsMuted(!isMuted);
    }
  };

  const cleanup = () => {
    if (audioStreamRef.current) {
      audioStreamRef.current.getTracks().forEach(track => track.stop());
    }
    if (conversationManagerRef.current) {
      conversationManagerRef.current.clearConversationState();
    }
  };

  return (
    <div className="space-y-6">
      {/* Call Controls */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <div className="flex justify-center items-center space-x-4">
          <Button
            onClick={toggleMute}
            className={`w-12 h-12 rounded-full ${isMuted ? 'bg-red-500 hover:bg-red-600' : 'bg-blue-500 hover:bg-blue-600'}`}
          >
            {isMuted ? <MicOff className="w-6 h-6 text-white" /> : <Mic className="w-6 h-6 text-white" />}
          </Button>

          <Button
            onClick={isRecording ? stopRecording : startRecording}
            disabled={isAISpeaking}
            className={`w-16 h-16 rounded-full ${
              isRecording 
                ? 'bg-red-500 hover:bg-red-600 animate-pulse' 
                : 'bg-green-500 hover:bg-green-600'
            }`}
          >
            <Mic className="w-8 h-8 text-white" />
          </Button>

          <Button
            onClick={onCallEnd}
            className="w-12 h-12 rounded-full bg-red-500 hover:bg-red-600"
          >
            <PhoneOff className="w-6 h-6 text-white" />
          </Button>
        </div>

        <div className="text-center mt-4">
          <div className="flex items-center justify-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${isRecording ? 'bg-red-500 animate-pulse' : 'bg-gray-300'}`} />
            <span className="text-sm text-gray-600">
              {isRecording ? 'Enregistrement...' : isAISpeaking ? 'IA en train de parler...' : 'En attente'}
            </span>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 p-4 rounded-lg border border-red-200">
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

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
        <h3 className="font-semibold mb-4">Statistiques de l'appel</h3>
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
              {config.temperature}
            </p>
            <p className="text-sm text-gray-600">Température IA</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-orange-600">
              {config.latency}s
            </p>
            <p className="text-sm text-gray-600">Latence</p>
          </div>
        </div>
      </div>
    </div>
  );
}