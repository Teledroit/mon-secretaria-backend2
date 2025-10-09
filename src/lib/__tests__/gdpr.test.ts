import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({ data: { id: '123' }, error: null })),
        })),
      })),
      insert: vi.fn(() => Promise.resolve({ data: null, error: null })),
      delete: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({ data: null, error: null })),
      })),
      update: vi.fn(() => ({
        eq: vi.fn(() => ({
          eq: vi.fn(() => Promise.resolve({ data: null, error: null })),
        })),
      })),
    })),
  },
}));

describe('GDPR Functions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  describe('getCookieConsent', () => {
    it('should return null when no consent is stored', async () => {
      const { getCookieConsent } = await import('../gdpr');
      const consent = await getCookieConsent();
      expect(consent).toBeNull();
    });

    it('should return stored consent', async () => {
      const mockConsent = { necessary: true, analytics: false, marketing: false };
      localStorage.setItem('cookie_consent', JSON.stringify(mockConsent));

      const { getCookieConsent } = await import('../gdpr');
      const consent = await getCookieConsent();
      expect(consent).toEqual(mockConsent);
    });
  });

  describe('updateCookieConsent', () => {
    it('should store cookie consent in localStorage', async () => {
      const { updateCookieConsent } = await import('../gdpr');
      const consent = { necessary: true, analytics: true, marketing: false };

      await updateCookieConsent(consent);

      const stored = localStorage.getItem('cookie_consent');
      expect(stored).toBeDefined();
      const parsed = JSON.parse(stored!);
      expect(parsed.necessary).toBe(true);
      expect(parsed.analytics).toBe(true);
      expect(parsed.marketing).toBe(false);
    });
  });
});
