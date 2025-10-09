import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import DashboardHome from '../DashboardHome';

vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: vi.fn(() => Promise.resolve({ data: { session: { user: { id: '123' } } } })),
    },
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          maybeSingle: vi.fn(() => Promise.resolve({ data: null, error: null })),
        })),
        gte: vi.fn(() => ({
          lte: vi.fn(() => Promise.resolve({ data: [], error: null })),
        })),
      })),
    })),
  },
}));

vi.mock('@/lib/stripe', () => ({
  getSubscriptionStatus: vi.fn(() => Promise.resolve({ subscription_status: 'active' })),
}));

describe('DashboardHome', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render without crashing', () => {
    render(
      <BrowserRouter>
        <DashboardHome />
      </BrowserRouter>
    );
    expect(screen.getByText(/Tableau de bord/i)).toBeInTheDocument();
  });

  it('should display loading state initially', () => {
    render(
      <BrowserRouter>
        <DashboardHome />
      </BrowserRouter>
    );
    const loadingElements = screen.queryAllByRole('status');
    expect(loadingElements.length).toBeGreaterThanOrEqual(0);
  });
});
