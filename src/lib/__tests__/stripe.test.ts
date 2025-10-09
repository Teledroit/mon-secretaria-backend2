import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createCheckoutSession, getSubscriptionStatus } from '../stripe';

// Mock fetch globally
global.fetch = vi.fn();

describe('Stripe Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createCheckoutSession', () => {
    it('creates checkout session successfully', async () => {
      const mockResponse = {
        ok: true,
        json: () => Promise.resolve({
          sessionId: 'cs_test_123',
          url: 'https://checkout.stripe.com/pay/cs_test_123'
        })
      };

      (fetch as any).mockResolvedValueOnce(mockResponse);

      const result = await createCheckoutSession(
        'price_123',
        'subscription',
        'https://success.com',
        'https://cancel.com'
      );

      expect(result).toEqual({
        sessionId: 'cs_test_123',
        url: 'https://checkout.stripe.com/pay/cs_test_123'
      });
    });

    it('throws error when user not authenticated', async () => {
      await expect(
        createCheckoutSession('price_123', 'subscription', 'success', 'cancel')
      ).rejects.toThrow('User not authenticated');
    });

    it('handles API errors gracefully', async () => {
      const mockResponse = {
        ok: false,
        json: () => Promise.resolve({ message: 'Invalid price ID' })
      };

      (fetch as any).mockResolvedValueOnce(mockResponse);

      await expect(
        createCheckoutSession('invalid_price', 'subscription', 'success', 'cancel')
      ).rejects.toThrow();
    });
  });

  describe('getSubscriptionStatus', () => {
    it('returns subscription status when available', async () => {
      const mockSubscription = {
        subscription_id: 'sub_123',
        subscription_status: 'active',
        price_id: 'price_123'
      };

      // Mock successful response
      const result = await getSubscriptionStatus();
      expect(result).toBeDefined();
    });

    it('returns null when no subscription found', async () => {
      const result = await getSubscriptionStatus();
      expect(result).toBeNull();
    });
  });
});