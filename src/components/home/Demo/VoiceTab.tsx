import { useState } from 'react';
import Button from '../../ui/Button';

interface VoiceTabProps {
  onVoiceTypeChange?: (value: string) => void;
  onWelcomeMessageChange?: (value: string) => void;
}

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

export default function VoiceTab({ onVoiceTypeChange, onWelcomeMessageChange }: VoiceTabProps) {
  const [voiceType, setVoiceType] = useState('female-professional');
  const [welcomeMessage, setWelcomeMessage] = useState(
    "Bonjour, Camille Dufour au téléphone, vous êtes en communication avec le secrétariat du cabinet. Comment puis-je vous aider"
  );
  const [isPlaying, setIsPlaying] = useState(false);

  const handleVoiceTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setVoiceType(e.target.value);
    onVoiceTypeChange?.(ELEVENLABS_VOICES[e.target.value as keyof typeof ELEVENLABS_VOICES].name);
  };

  const handleWelcomeMessageChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setWelcomeMessage(e.target.value);
    onWelcomeMessageChange?.(e.target.value);
  };

  const playAudioExample = async () => {
    setIsPlaying(true);
    try {
      const voice = ELEVENLABS_VOICES[voiceType as keyof typeof ELEVENLABS_VOICES];
      const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voice.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'xi-api-key': import.meta.env.VITE_ELEVENLABS_API_KEY
        },
        body: JSON.stringify({
          text: welcomeMessage,
          model_id: 'eleven_multilingual_v2', // Use multilingual model
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75,
            style: 0.0,
            use_speaker_boost: true
          },
          language_code: 'fr' // Specify French language
        })
      });

      if (!response.ok) throw new Error('Failed to generate speech');

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      
      audio.onended = () => {
        setIsPlaying(false);
        URL.revokeObjectURL(audioUrl);
      };

      await audio.play();
    } catch (error) {
      console.error('Error playing audio:', error);
      setIsPlaying(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Type de Voix
        </label>
        <select 
          className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          value={voiceType}
          onChange={handleVoiceTypeChange}
        >
          {Object.entries(ELEVENLABS_VOICES).map(([id, voice]) => (
            <option key={id} value={id}>{voice.name}</option>
          ))}
        </select>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Vitesse de Parole
        </label>
        <input 
          type="range" 
          min="0.5" 
          max="2" 
          step="0.1" 
          defaultValue="1"
          className="w-full"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Message d'Accueil
        </label>
        <textarea 
          rows={4}
          className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          value={welcomeMessage}
          onChange={handleWelcomeMessageChange}
        />
      </div>

      <Button 
        className="w-full"
        onClick={playAudioExample}
        disabled={isPlaying}
      >
        {isPlaying ? 'Lecture en cours...' : 'Écouter un Exemple'}
      </Button>
    </div>
  );
}