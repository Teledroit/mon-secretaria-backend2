import { supabase } from './supabase';

export interface VoiceConfig {
  ttsEngine: 'elevenlabs' | 'google' | 'azure';
  nlpEngine: 'gpt4' | 'gpt35' | 'claude';
  voiceId?: string;
  voiceType?: 'male' | 'female';
  temperature: number;
  systemInstructions?: string;
  welcomeMessage?: string;
  latency: number;
  interruptionSensitivity: number;
  enableBackchanneling: boolean;
  enableSpeechNormalization: boolean;
}

export class VoiceProcessor {
  private config: VoiceConfig;
  private isProcessing: boolean = false;

  constructor(config: VoiceConfig) {
    this.config = config;
  }

  async processAudioInput(audioBlob: Blob): Promise<string> {
    if (this.isProcessing) {
      throw new Error('Already processing audio input');
    }

    this.isProcessing = true;

    try {
      // Convert audio to base64
      const arrayBuffer = await audioBlob.arrayBuffer();
      const base64Audio = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));

      // Send to speech-to-text function
      const { data: { session } } = await supabase.auth.getSession();
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/process-voice-input`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token || import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          audioData: base64Audio,
          userId: session?.user?.id
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Speech recognition failed');
      }

      const result = await response.json();
      return result.transcription;

    } catch (error) {
      console.error('Error processing audio input:', error);
      throw error;
    } finally {
      this.isProcessing = false;
    }
  }

  async generateSpeech(text: string): Promise<Blob> {
    try {
      const requestBody: any = {
        text,
        tts_engine: this.config.ttsEngine
      };

      if (this.config.ttsEngine === 'elevenlabs') {
        requestBody.voice_id = this.config.voiceId;
      } else {
        requestBody.voice_type = this.config.voiceType;
      }

      const { data: { session } } = await supabase.auth.getSession();
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/text-to-speech`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token || import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Speech synthesis failed');
      }

      return await response.blob();

    } catch (error) {
      console.error('Error generating speech:', error);
      throw error;
    }
  }

  async detectSilence(audioStream: MediaStream): Promise<boolean> {
    return new Promise((resolve) => {
      const audioContext = new AudioContext();
      const analyser = audioContext.createAnalyser();
      const microphone = audioContext.createMediaStreamSource(audioStream);
      
      microphone.connect(analyser);
      analyser.fftSize = 256;
      
      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      
      let silenceStart = Date.now();
      const silenceThreshold = 30; // Adjust based on your needs
      const maxSilence = this.config.latency * 1000; // Convert to milliseconds

      const checkAudio = () => {
        analyser.getByteFrequencyData(dataArray);
        
        const average = dataArray.reduce((a, b) => a + b) / bufferLength;
        
        if (average < silenceThreshold) {
          if (Date.now() - silenceStart > maxSilence) {
            audioContext.close();
            resolve(true); // Silence detected
            return;
          }
        } else {
          silenceStart = Date.now();
        }
        
        requestAnimationFrame(checkAudio);
      };
      
      checkAudio();
    });
  }

  updateConfig(newConfig: Partial<VoiceConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }
}