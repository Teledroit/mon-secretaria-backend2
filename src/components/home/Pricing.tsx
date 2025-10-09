import { Check } from 'lucide-react';
import { useState } from 'react';
import Button from '../ui/Button';
import { redirectToCheckout } from '@/lib/stripe';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { STRIPE_PRODUCTS } from '@/stripe-config';

const plans = [
  {
    name: STRIPE_PRODUCTS.STARTER.name,
    price: STRIPE_PRODUCTS.STARTER.price,
    productId: 'STARTER',
    description: STRIPE_PRODUCTS.STARTER.description,
    features: STRIPE_PRODUCTS.STARTER.features
  },
  {
    name: STRIPE_PRODUCTS.PREMIUM.name,
    price: STRIPE_PRODUCTS.PREMIUM.price,
    productId: 'PREMIUM',
    description: STRIPE_PRODUCTS.PREMIUM.description,
    features: STRIPE_PRODUCTS.PREMIUM.features,
    popular: true
  }
];

const aiEngines = [
  {
    id: 'gpt-4',
    name: 'GPT-4',
    basePrice: 0.06, // €0.06 per minute
    description: 'Performances optimales, compréhension approfondie'
  },
  {
    id: 'gpt-35',
    name: 'GPT-3.5',
    basePrice: 0.02, // €0.02 per minute
    description: 'Bon rapport qualité/prix'
  },
  {
    id: 'claude',
    name: 'Claude 2',
    basePrice: 0.04, // €0.04 per minute
    description: 'Excellente compréhension contextuelle'
  }
];

export default function Pricing() {
  const [selectedEngine, setSelectedEngine] = useState(aiEngines[0]);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { session } = useAuth();

  const handleSubscribe = async (productId: string) => {
    try {
      setIsLoading(true);
      
      // If user is not authenticated, redirect to register
      if (!session) {
        navigate('/register', { 
          state: { 
            returnTo: '/#pricing',
            selectedPlan: productId,
            message: 'Veuillez créer un compte pour continuer votre abonnement.' 
          }
        });
        return;
      }

      await redirectToCheckout(productId as 'STARTER' | 'PREMIUM');
    } catch (error) {
      console.error('Error initiating checkout:', error);
      
      if (error instanceof Error) {
        if (error.message.includes('login')) {
          navigate('/login', { 
            state: { 
              returnTo: '/#pricing',
              selectedPlan: productId,
              message: 'Votre session a expiré. Veuillez vous reconnecter.' 
            }
          });
        } else {
          alert('Une erreur est survenue. Veuillez réessayer.');
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  const calculateCostRange = (basePrice: number) => {
    const minMinutes = 100;
    const maxMinutes = 500;
    const pricePerMinute = basePrice; // Prix direct sans marge supplémentaire
    
    return {
      min: Math.round(minMinutes * pricePerMinute * 100) / 100,
      max: Math.round(maxMinutes * pricePerMinute * 100) / 100
    };
  };

  const costRange = calculateCostRange(selectedEngine.basePrice);

  return (
    <section id="pricing" className="py-20 bg-gray-50">
      <div className="container mx-auto px-4">
        <h2 className="text-4xl font-bold text-center mb-4">
          Tarifs Adaptés à Vos Besoins
        </h2>
        <p className="text-center text-gray-600 mb-12 max-w-2xl mx-auto">
          Choisissez la formule qui correspond à vos besoins. 
          Les coûts d'utilisation de l'IA sont facturés séparément selon votre consommation.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto mb-12">
          {plans.map((plan) => (
            <div 
              key={plan.name}
              className={`bg-white rounded-lg p-8 ${
                plan.popular ? 'ring-2 ring-blue-500 shadow-lg' : 'border'
              }`}
            >
              {plan.popular && (
                <span className="bg-blue-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                  Recommandé
                </span>
              )}
              <h3 className="text-2xl font-bold mt-4">{plan.name}</h3>
              <div className="mt-4 flex items-baseline">
                <span className="text-4xl font-bold">{plan.price}</span>
                <span className="ml-1 text-gray-500">€/mois</span>
              </div>
              <p className="mt-4 text-gray-500">{plan.description}</p>
              <ul className="mt-6 space-y-4">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-center">
                    <Check className="h-5 w-5 text-blue-500 mr-2" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              <Button 
                variant={plan.popular ? 'primary' : 'outline'}
                className="w-full mt-8"
                onClick={() => handleSubscribe(plan.productId)}
                disabled={isLoading}
              >
                {isLoading ? 'Chargement...' : 'Commencer'}
              </Button>
            </div>
          ))}
        </div>

        <div className="bg-blue-50 rounded-xl p-8 max-w-3xl mx-auto">
          <h3 className="text-xl font-semibold text-center mb-6">Coûts d'utilisation de l'IA</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            {aiEngines.map((engine) => (
              <button
                key={engine.id}
                onClick={() => setSelectedEngine(engine)}
                className={`p-4 rounded-lg text-left transition-colors ${
                  selectedEngine.id === engine.id
                    ? 'bg-white shadow-md border-2 border-blue-500'
                    : 'bg-white/50 border border-gray-200 hover:bg-white'
                }`}
              >
                <h4 className="font-medium">{engine.name}</h4>
                <p className="text-sm text-gray-600 mt-1">{engine.description}</p>
                <p className="text-sm font-medium text-blue-600 mt-2">
                  {engine.basePrice}€/minute
                </p>
              </button>
            ))}
          </div>

          <div className="bg-white rounded-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <span className="font-medium">Moteur sélectionné :</span>
              <span className="text-blue-600">{selectedEngine.name}</span>
            </div>
            
            <div className="space-y-2">
              <p className="text-gray-600">
                Coût estimé par mois (hors abonnement de base) :
              </p>
              <p className="text-lg font-semibold">
                {costRange.min}€ - {costRange.max}€
              </p>
              <p className="text-sm text-gray-500">
                Basé sur une utilisation de 100 à 500 minutes par mois
              </p>
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">
                  <strong>Note :</strong> Ces coûts s'ajoutent à l'abonnement de base qui inclut l'accès à la plateforme
                  et les fonctionnalités essentielles. La facturation à l'usage permet d'optimiser vos coûts en fonction
                  de votre utilisation réelle. Les estimations sont données à titre indicatif et peuvent varier en fonction de l'utilisation réelle et du modèle d'IA sélectionné.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}