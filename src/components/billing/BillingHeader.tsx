import { CreditCard, Download } from 'lucide-react';
import Button from '@/components/ui/Button';
import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { STRIPE_PRODUCTS } from '@/stripe-config';

interface BillingHeaderProps {
  currentPlan: string;
  isOverdue: boolean;
  isPaused: boolean;
  customerPortalUrl?: string;
  onPauseToggle: () => void;
  onCancel: () => void;
}

export default function BillingHeader({ 
  currentPlan, 
  isOverdue, 
  isPaused, 
  customerPortalUrl,
  onPauseToggle, 
  onCancel 
}: BillingHeaderProps) {
  const navigate = useNavigate();
  const [isToggling, setIsToggling] = useState(false);

  const handlePauseToggle = async () => {
    try {
      setIsToggling(true);
      await onPauseToggle();
    } catch (error) {
      console.error('Error toggling service:', error);
      alert('Une erreur est survenue lors de la mise en pause du service');
    } finally {
      setIsToggling(false);
    }
  };

  return (
    <div className="flex justify-between items-start mb-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Facturation</h1>
        <div className="flex items-center gap-4 mt-2">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">
              Plan actuel : <span className="font-medium">{currentPlan}</span>
            </span>
            {customerPortalUrl && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => customerPortalUrl && window.open(customerPortalUrl, '_blank')}
                disabled={!customerPortalUrl}
              >
                {customerPortalUrl ? 'Gérer l\'abonnement' : 'Chargement...'}
              </Button>
            )}
          </div>
          <Button 
            variant="outline" 
            size="sm"
            onClick={handlePauseToggle}
            disabled={isToggling}
            className={`${
              isPaused 
                ? 'text-orange-600 hover:text-orange-700 border-orange-200 hover:border-orange-300'
                : 'text-blue-600 hover:text-blue-700 border-blue-200 hover:border-blue-300'
            }`}
          >
            {isToggling 
              ? 'En cours...' 
              : isPaused 
                ? 'Reprendre le service' 
                : 'Mettre en pause'
            }
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={onCancel}
            className="text-red-600 hover:text-red-700 border-red-200 hover:border-red-300"
          >
            Annuler l'abonnement
          </Button>
        </div>
      </div>
      {isOverdue && (
        <div className="bg-red-50 text-red-700 px-4 py-2 rounded-lg text-sm flex items-center">
          <span className="font-medium">Compte bloqué : facture(s) impayée(s)</span>
        </div>
      )}
    </div>
  );
}