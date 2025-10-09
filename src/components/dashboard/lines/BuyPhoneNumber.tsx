import { useState, useEffect } from 'react';
import { Phone, Search, CircleAlert as AlertCircle, ExternalLink } from 'lucide-react';
import Button from '@/components/ui/Button';
import { twilioIntegration } from '@/lib/integrations/twilio';

interface PhoneNumber {
  number: string;
  location: string;
  type: 'local' | 'mobile' | 'tollfree';
  price: number;
  status?: string;
}

interface ErrorDetails {
  code?: number;
  requiresUpgrade?: boolean;
  twilioDocsUrl?: string;
}

export default function BuyPhoneNumber() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [availableNumbers, setAvailableNumbers] = useState<PhoneNumber[]>([]);
  const [ownedNumbers, setOwnedNumbers] = useState<PhoneNumber[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [errorDetails, setErrorDetails] = useState<ErrorDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadOwnedNumbers();
  }, []);

  const loadOwnedNumbers = async () => {
    try {
      const numbers = await twilioIntegration.getUserPhoneNumbers();
      
      setOwnedNumbers(numbers.map(n => ({
        number: n.phone_number,
        location: n.friendly_name || 'France',
        type: 'local',
        price: 1,
        status: n.status
      })));
    } catch (err) {
      console.error('Error fetching owned numbers:', err);
      setError('Erreur lors de la récupération de vos numéros');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = async () => {
    const query = searchQuery.trim();
    if (!query) {
      setError("Veuillez entrer une ville ou un indicatif");
      setErrorDetails(null);
      return;
    }

    setError(null);
    setErrorDetails(null);
    setIsSearching(true);
    setAvailableNumbers([]);

    try {
      console.log('Searching for numbers with query:', query);
      const numbers = await twilioIntegration.searchPhoneNumbers(query);

      if (numbers.length === 0) {
        setError("Aucun numéro disponible pour cette recherche. Essayez avec une autre ville ou un autre indicatif.");
        setErrorDetails(null);
      } else {
        setAvailableNumbers(numbers);
      }
    } catch (err: any) {
      console.error('Search error:', err);

      let errorMessage = err?.message || "Une erreur est survenue lors de la recherche de numéros";
      let details: ErrorDetails | null = null;

      if (err?.response?.data) {
        if (err.response.data.details) {
          details = err.response.data.details;
        }
        if (err.response.data.error) {
          errorMessage = err.response.data.error;
        }
      }

      setError(errorMessage);
      setErrorDetails(details);
    } finally {
      setIsSearching(false);
    }
  };

  const handlePurchase = async (number: PhoneNumber) => {
    const confirmed = confirm(`Voulez-vous vraiment acheter le numéro ${number.number} pour ${number.price}€/mois ?`);

    if (!confirmed) {
      return;
    }

    setError(null);

    try {
      await twilioIntegration.purchasePhoneNumber(number.number);

      // Refresh the list of owned numbers
      await loadOwnedNumbers();

      // Remove the number from available numbers
      setAvailableNumbers(prev => prev.filter(n => n.number !== number.number));

      alert('Numéro acheté avec succès !');
    } catch (err: any) {
      console.error('Purchase error:', err);
      const errorMessage = err?.message || "Une erreur est survenue lors de l'achat du numéro";
      setError(errorMessage);
      alert(`Erreur: ${errorMessage}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Owned Numbers Section */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <h3 className="text-lg font-medium mb-4">Vos numéros de téléphone</h3>
        {isLoading ? (
          <div className="animate-pulse space-y-4">
            <div className="h-12 bg-gray-200 rounded"></div>
            <div className="h-12 bg-gray-200 rounded"></div>
          </div>
        ) : ownedNumbers.length > 0 ? (
          <div className="space-y-4">
            {ownedNumbers.map((number) => (
              <div
                key={number.number}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center space-x-4">
                  <div className="p-2 bg-blue-50 rounded-lg">
                    <Phone className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium">{number.number}</p>
                    <p className="text-sm text-gray-500">{number.location}</p>
                  </div>
                </div>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  Actif
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-center py-4">
            Vous n'avez pas encore de numéro de téléphone
          </p>
        )}
      </div>

      <div className="space-y-4">
        <div className="flex gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Rechercher par ville (ex: Paris, Lyon, Marseille) ou indicatif (ex: 01, 06)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
            <p className="mt-1 text-xs text-gray-500">
              Exemples: "Paris", "Lyon", "01" (indicatif régional)
            </p>
          </div>
          <Button
            onClick={handleSearch}
            disabled={isSearching || !searchQuery.trim()}
          >
            <Search className="w-4 h-4 mr-2" />
            {isSearching ? 'Recherche...' : 'Rechercher'}
          </Button>
        </div>

        {error && (
          <div className={`p-4 border rounded-lg ${
            errorDetails?.requiresUpgrade
              ? 'bg-amber-50 border-amber-200'
              : 'bg-red-50 border-red-200'
          }`}>
            <div className="flex items-start space-x-3">
              <AlertCircle className={`w-5 h-5 mt-0.5 flex-shrink-0 ${
                errorDetails?.requiresUpgrade ? 'text-amber-600' : 'text-red-600'
              }`} />
              <div className="flex-1">
                <p className={`text-sm font-medium ${
                  errorDetails?.requiresUpgrade ? 'text-amber-800' : 'text-red-800'
                }`}>
                  {error}
                </p>
                {errorDetails?.requiresUpgrade && (
                  <div className="mt-3 space-y-2">
                    <p className="text-sm text-amber-700">
                      Pour activer cette fonctionnalité :
                    </p>
                    <ol className="list-decimal list-inside text-sm text-amber-700 space-y-1 ml-2">
                      <li>Connectez-vous à votre console Twilio</li>
                      <li>Ajoutez des informations de facturation</li>
                      <li>Mettez à niveau vers un compte de production</li>
                      <li>Assurez-vous d'avoir un solde suffisant (environ 1-2€/mois par numéro)</li>
                    </ol>
                    {errorDetails.twilioDocsUrl && (
                      <a
                        href={errorDetails.twilioDocsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center space-x-1 text-sm text-amber-700 hover:text-amber-900 underline mt-2"
                      >
                        <span>En savoir plus sur la console Twilio</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                )}
                {errorDetails?.code && !errorDetails?.requiresUpgrade && (
                  <p className="text-xs text-red-600 mt-1">Code d'erreur: {errorDetails.code}</p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {availableNumbers.length > 0 && (
        <div className="space-y-4">
          <h3 className="font-medium">Numéros disponibles</h3>
          <div className="grid gap-4">
            {availableNumbers.map((number) => (
              <div
                key={number.number}
                className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200"
              >
                <div className="flex items-center space-x-4">
                  <div className="p-2 bg-blue-50 rounded-lg">
                    <Phone className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium">{number.number}</p>
                    <p className="text-sm text-gray-500">
                      {number.location} • {number.type === 'local' ? 'Local' : 'Mobile'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <p className="font-medium">{number.price}€/mois</p>
                  <Button onClick={() => handlePurchase(number)}>
                    Acheter
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}