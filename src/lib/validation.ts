import { z } from 'zod';

export const documentSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  type: z.enum(['pdf', 'url']),
  content: z.string().min(1, 'Content is required'),
});

export const aiConfigSchema = z.object({
  ttsEngine: z.enum(['google', 'elevenlabs', 'azure']),
  nlpEngine: z.enum(['gpt4', 'gpt35', 'claude']),
  voiceId: z.string().optional(),
  temperature: z.number().min(0).max(1),
  systemInstructions: z.string().max(10000),
  prompt: z.string().max(5000),
});

export const generalSettingsSchema = z.object({
  welcomeMessage: z.string().max(500),
  voiceType: z.enum(['female', 'male']),
  latency: z.number().min(0).max(1),
  interruptionSensitivity: z.number().min(0).max(1),
  enableBackchanneling: z.boolean(),
  maxCallDuration: z.number().min(1).max(60),
  silenceTimeout: z.number().min(1).max(20),
  detectVoicemail: z.boolean(),
  enableSpeechNormalization: z.boolean(),
  transferNumber: z.string().optional(),
  workingHours: z.object({
    start: z.string(),
    end: z.string(),
    workingDays: z.array(z.string())
  }),
  notifications: z.object({
    email: z.boolean(),
    sms: z.boolean()
  })
});