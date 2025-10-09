import { describe, it, expect, vi, beforeEach } from 'vitest';
import { withRetry, saveDocument, saveAIConfig } from '../supabase-utils';

describe('Supabase Utils', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('withRetry', () => {
    it('succeeds on first attempt', async () => {
      const operation = vi.fn().mockResolvedValue('success');
      
      const result = await withRetry(operation);
      
      expect(result).toBe('success');
      expect(operation).toHaveBeenCalledTimes(1);
    });

    it('retries on failure and eventually succeeds', async () => {
      const operation = vi.fn()
        .mockRejectedValueOnce(new Error('First failure'))
        .mockRejectedValueOnce(new Error('Second failure'))
        .mockResolvedValueOnce('success');
      
      const result = await withRetry(operation, 3, 100);
      
      expect(result).toBe('success');
      expect(operation).toHaveBeenCalledTimes(3);
    });

    it('throws error after max retries', async () => {
      const operation = vi.fn().mockRejectedValue(new Error('Persistent failure'));
      
      await expect(withRetry(operation, 2, 100)).rejects.toThrow('Persistent failure');
      expect(operation).toHaveBeenCalledTimes(2);
    });

    it('waits between retries', async () => {
      const operation = vi.fn()
        .mockRejectedValueOnce(new Error('Failure'))
        .mockResolvedValueOnce('success');
      
      const startTime = Date.now();
      await withRetry(operation, 3, 100);
      const endTime = Date.now();
      
      expect(endTime - startTime).toBeGreaterThanOrEqual(100);
    });
  });

  describe('saveDocument', () => {
    it('saves document successfully', async () => {
      const mockDocument = {
        name: 'Test Doc',
        type: 'pdf' as const,
        content: 'content',
        user_id: 'user123'
      };

      const result = await saveDocument(mockDocument);
      expect(result).toBeDefined();
    });
  });

  describe('saveAIConfig', () => {
    it('saves AI configuration successfully', async () => {
      const mockConfig = {
        ttsEngine: 'elevenlabs',
        nlpEngine: 'gpt4',
        temperature: 0.7
      };

      const result = await saveAIConfig(mockConfig);
      expect(result).toBeDefined();
    });
  });
});