import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import Hero from '../Hero';

// Mock scrollIntoView
Element.prototype.scrollIntoView = vi.fn();

const HeroWithRouter = () => (
  <BrowserRouter>
    <Hero />
  </BrowserRouter>
);

describe('Hero Component', () => {
  it('renders hero content correctly', () => {
    render(<HeroWithRouter />);
    
    expect(screen.getByText(/Standardiste IA/i)).toBeInTheDocument();
    expect(screen.getByText(/Nouvelle Génération/i)).toBeInTheDocument();
    expect(screen.getByText(/Un assistant téléphonique intelligent/i)).toBeInTheDocument();
  });

  it('renders call-to-action buttons', () => {
    render(<HeroWithRouter />);
    
    expect(screen.getByText(/Votre secretarIA/i)).toBeInTheDocument();
    expect(screen.getByText(/Voir la démo/i)).toBeInTheDocument();
  });

  it('scrolls to pricing when CTA button is clicked', () => {
    // Mock getElementById
    const mockElement = { scrollIntoView: vi.fn() };
    vi.spyOn(document, 'getElementById').mockReturnValue(mockElement as any);

    render(<HeroWithRouter />);
    
    const ctaButton = screen.getByText(/Votre secretarIA/i);
    fireEvent.click(ctaButton);
    
    expect(document.getElementById).toHaveBeenCalledWith('pricing');
    expect(mockElement.scrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth' });
  });

  it('scrolls to demo when demo button is clicked', () => {
    const mockElement = { scrollIntoView: vi.fn() };
    vi.spyOn(document, 'getElementById').mockReturnValue(mockElement as any);

    render(<HeroWithRouter />);
    
    const demoButton = screen.getByText(/Voir la démo/i);
    fireEvent.click(demoButton);
    
    expect(document.getElementById).toHaveBeenCalledWith('demo-section');
    expect(mockElement.scrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth' });
  });

  it('renders feature highlights', () => {
    render(<HeroWithRouter />);
    
    expect(screen.getByText(/99.9% Disponibilité/i)).toBeInTheDocument();
    expect(screen.getByText(/Prise de RDV Intelligente/i)).toBeInTheDocument();
    expect(screen.getByText(/Support 24\/7/i)).toBeInTheDocument();
  });
});