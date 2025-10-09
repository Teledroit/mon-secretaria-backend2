import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import Button from '../ui/Button';

export default function CookieConsent() {
  const [showBanner, setShowBanner] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('cookie_consent');
    if (!consent) {
      setShowBanner(true);
    }
  }, []);

  const acceptAll = () => {
    const consent = {
      necessary: true,
      analytics: true,
      marketing: true,
      timestamp: new Date().toISOString(),
    };
    localStorage.setItem('cookie_consent', JSON.stringify(consent));
    setShowBanner(false);
  };

  const acceptNecessary = () => {
    const consent = {
      necessary: true,
      analytics: false,
      marketing: false,
      timestamp: new Date().toISOString(),
    };
    localStorage.setItem('cookie_consent', JSON.stringify(consent));
    setShowBanner(false);
  };

  if (!showBanner) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 shadow-lg">
      <div className="max-w-7xl mx-auto p-4 sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Gestion des cookies
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Nous utilisons des cookies pour améliorer votre expérience, analyser notre trafic et personnaliser le contenu.
              {' '}
              <button
                onClick={() => setShowDetails(!showDetails)}
                className="text-blue-600 hover:underline"
              >
                {showDetails ? 'Masquer les détails' : 'En savoir plus'}
              </button>
            </p>

            {showDetails && (
              <div className="mb-4 p-4 bg-gray-50 rounded-lg text-sm">
                <div className="mb-3">
                  <h4 className="font-semibold text-gray-900 mb-1">Cookies nécessaires</h4>
                  <p className="text-gray-600">
                    Ces cookies sont essentiels au fonctionnement du site et ne peuvent pas être désactivés.
                  </p>
                </div>
                <div className="mb-3">
                  <h4 className="font-semibold text-gray-900 mb-1">Cookies analytiques</h4>
                  <p className="text-gray-600">
                    Ces cookies nous aident à comprendre comment les visiteurs interagissent avec notre site.
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">Cookies marketing</h4>
                  <p className="text-gray-600">
                    Ces cookies sont utilisés pour afficher des publicités pertinentes.
                  </p>
                </div>
              </div>
            )}

            <div className="flex flex-wrap gap-3">
              <Button onClick={acceptAll}>
                Tout accepter
              </Button>
              <Button onClick={acceptNecessary} variant="secondary">
                Cookies nécessaires uniquement
              </Button>
              <a
                href="/politique-de-confidentialite"
                className="text-sm text-gray-600 hover:text-gray-900 underline self-center"
              >
                Politique de confidentialité
              </a>
            </div>
          </div>

          <button
            onClick={acceptNecessary}
            className="text-gray-400 hover:text-gray-600"
            aria-label="Fermer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
