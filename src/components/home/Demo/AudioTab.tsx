import { useState } from 'react';
import { Volume2, Mic, Radio } from 'lucide-react';
import Button from '../../ui/Button';

export default function AudioTab() {
  const [isPlaying, setIsPlaying] = useState(false);

  const handleTestAudio = async () => {
    setIsPlaying(true);
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      // Test audio parameters
      oscillator.frequency.value = 440; // A4 note
      gainNode.gain.value = 0.1;

      oscillator.start();
      await new Promise(resolve => setTimeout(resolve, 1000));
      oscillator.stop();
      
      // Play a test message
      const utterance = new SpeechSynthesisUtterance("Test de qualité audio réussi");
      utterance.lang = 'fr-FR';
      utterance.onend = () => setIsPlaying(false);
      window.speechSynthesis.speak(utterance);
    } catch (error) {
      console.error('Error testing audio:', error);
      setIsPlaying(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Volume de l'Assistant
        </label>
        <div className="flex items-center space-x-4">
          <Volume2 className="w-5 h-5 text-gray-500" />
          <input 
            type="range" 
            min="0" 
            max="100" 
            defaultValue="80"
            className="flex-1"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Qualité Audio
        </label>
        <select className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500">
          <option>Haute Définition (48kHz)</option>
          <option>Standard (44.1kHz)</option>
          <option>Économique (32kHz)</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Réduction de Bruit
        </label>
        <div className="space-y-2">
          <label className="flex items-center space-x-2">
            <input type="checkbox" defaultChecked className="rounded text-blue-600" />
            <span className="text-sm">Suppression du bruit de fond</span>
          </label>
          <label className="flex items-center space-x-2">
            <input type="checkbox" defaultChecked className="rounded text-blue-600" />
            <span className="text-sm">Élimination de l'écho</span>
          </label>
        </div>
      </div>

      <div className="p-4 bg-blue-50 rounded-lg">
        <div className="flex items-center space-x-3 mb-3">
          <Radio className="w-5 h-5 text-blue-600" />
          <h3 className="font-medium">Test Audio</h3>
        </div>
        <p className="text-sm text-gray-600 mb-4">
          Testez la qualité audio avec un exemple d'appel
        </p>
        <Button 
          variant="outline" 
          className="w-full"
          onClick={handleTestAudio}
          disabled={isPlaying}
        >
          {isPlaying ? 'Test en cours...' : 'Lancer le Test Audio'}
        </Button>
      </div>
    </div>
  );
}