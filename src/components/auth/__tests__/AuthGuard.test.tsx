import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import AuthGuard from '../AuthGuard';

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useLocation: () => ({ pathname: '/dashboard' }),
    Navigate: ({ to }: { to: string }) => <div data-testid="navigate">{to}</div>
  };
});

vi.mock('@/lib/stripe', () => ({
  getSubscriptionStatus: vi.fn()
}));

const AuthGuardWithRouter = ({ children }: { children: React.ReactNode }) => (
  <BrowserRouter>
    <AuthGuard>{children}</AuthGuard>
  </BrowserRouter>
);

describe('AuthGuard Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows loading state initially', () => {
    render(
      <AuthGuardWithRouter>
        <div>Protected Content</div>
      </AuthGuardWithRouter>
    );
    
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('redirects to login when not authenticated', async () => {
    const { getSubscriptionStatus } = await import('@/lib/stripe');
    (getSubscriptionStatus as any).mockResolvedValue(null);

    render(
      <AuthGuardWithRouter>
        <div>Protected Content</div>
      </AuthGuardWithRouter>
    );

    await waitFor(() => {
      expect(screen.getByTestId('navigate')).toHaveTextContent('/login');
    });
  });

  it('renders children when authenticated with valid subscription', async () => {
    const { getSubscriptionStatus } = await import('@/lib/stripe');
    (getSubscriptionStatus as any).mockResolvedValue({
      subscription_status: 'active'
    });

    render(
      <AuthGuardWithRouter>
        <div>Protected Content</div>
      </AuthGuardWithRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Protected Content')).toBeInTheDocument();
    });
  });
});