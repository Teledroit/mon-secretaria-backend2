import { describe, it, expect } from 'vitest';
import { documentSchema, aiConfigSchema, generalSettingsSchema } from '../validation';

describe('Validation Schemas', () => {
  describe('documentSchema', () => {
    it('validates correct document data', () => {
      const validDocument = {
        name: 'Test Document',
        type: 'pdf' as const,
        content: 'base64content'
      };

      const result = documentSchema.safeParse(validDocument);
      expect(result.success).toBe(true);
    });

    it('rejects invalid document type', () => {
      const invalidDocument = {
        name: 'Test Document',
        type: 'invalid' as any,
        content: 'content'
      };

      const result = documentSchema.safeParse(invalidDocument);
      expect(result.success).toBe(false);
    });

    it('requires name and content', () => {
      const incompleteDocument = {
        type: 'pdf' as const
      };

      const result = documentSchema.safeParse(incompleteDocument);
      expect(result.success).toBe(false);
    });
  });

  describe('aiConfigSchema', () => {
    it('validates correct AI configuration', () => {
      const validConfig = {
        ttsEngine: 'elevenlabs' as const,
        nlpEngine: 'gpt4' as const,
        temperature: 0.7,
        systemInstructions: 'Test instructions',
        prompt: 'Test prompt'
      };

      const result = aiConfigSchema.safeParse(validConfig);
      expect(result.success).toBe(true);
    });

    it('validates temperature range', () => {
      const invalidConfig = {
        ttsEngine: 'elevenlabs' as const,
        nlpEngine: 'gpt4' as const,
        temperature: 1.5, // Invalid: > 1
        systemInstructions: 'Test',
        prompt: 'Test'
      };

      const result = aiConfigSchema.safeParse(invalidConfig);
      expect(result.success).toBe(false);
    });
  });

  describe('generalSettingsSchema', () => {
    it('validates correct general settings', () => {
      const validSettings = {
        welcomeMessage: 'Welcome message',
        voiceType: 'female' as const,
        latency: 0.5,
        interruptionSensitivity: 0.7,
        enableBackchanneling: true,
        maxCallDuration: 30,
        silenceTimeout: 10,
        detectVoicemail: true,
        enableSpeechNormalization: true,
        workingHours: {
          start: '09:00',
          end: '18:00',
          workingDays: ['monday', 'tuesday']
        },
        notifications: {
          email: true,
          sms: false
        }
      };

      const result = generalSettingsSchema.safeParse(validSettings);
      expect(result.success).toBe(true);
    });

    it('validates working hours format', () => {
      const invalidSettings = {
        welcomeMessage: 'Test',
        voiceType: 'female' as const,
        latency: 0.5,
        interruptionSensitivity: 0.7,
        enableBackchanneling: true,
        maxCallDuration: 30,
        silenceTimeout: 10,
        detectVoicemail: true,
        enableSpeechNormalization: true,
        workingHours: {
          start: 'invalid-time',
          end: '18:00',
          workingDays: ['monday']
        },
        notifications: {
          email: true,
          sms: false
        }
      };

      const result = generalSettingsSchema.safeParse(invalidSettings);
      expect(result.success).toBe(false);
    });
  });
});