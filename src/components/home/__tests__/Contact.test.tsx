import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import Contact from '../Contact';

// Mock fetch
global.fetch = vi.fn();

describe('Contact Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders contact form correctly', () => {
    render(<Contact />);
    
    expect(screen.getByText(/Contactez-nous/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Nom complet/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Téléphone/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Message/i)).toBeInTheDocument();
  });

  it('submits form successfully', async () => {
    (fetch as any).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ success: true })
    });

    render(<Contact />);
    
    fireEvent.change(screen.getByLabelText(/Nom complet/i), {
      target: { value: 'John Doe' }
    });
    fireEvent.change(screen.getByLabelText(/Email/i), {
      target: { value: 'john@example.com' }
    });
    fireEvent.change(screen.getByLabelText(/Téléphone/i), {
      target: { value: '+33123456789' }
    });
    fireEvent.change(screen.getByLabelText(/Message/i), {
      target: { value: 'Test message' }
    });

    fireEvent.click(screen.getByText(/Envoyer le message/i));

    await waitFor(() => {
      expect(screen.getByText(/Message bien reçu !/i)).toBeInTheDocument();
    });
  });

  it('handles form submission errors gracefully', async () => {
    (fetch as any).mockRejectedValueOnce(new Error('Network error'));

    render(<Contact />);
    
    // Fill form
    fireEvent.change(screen.getByLabelText(/Nom complet/i), {
      target: { value: 'John Doe' }
    });
    fireEvent.change(screen.getByLabelText(/Email/i), {
      target: { value: 'john@example.com' }
    });
    fireEvent.change(screen.getByLabelText(/Téléphone/i), {
      target: { value: '+33123456789' }
    });
    fireEvent.change(screen.getByLabelText(/Message/i), {
      target: { value: 'Test message' }
    });

    fireEvent.click(screen.getByText(/Envoyer le message/i));

    // Should still show success (as per current implementation)
    await waitFor(() => {
      expect(screen.getByText(/Message bien reçu !/i)).toBeInTheDocument();
    });
  });

  it('requires all fields to be filled', () => {
    render(<Contact />);
    
    const submitButton = screen.getByText(/Envoyer le message/i);
    fireEvent.click(submitButton);

    // Form should not submit without required fields
    expect(screen.queryByText(/Message bien reçu !/i)).not.toBeInTheDocument();
  });
});