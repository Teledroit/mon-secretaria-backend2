import { useNavigate } from 'react-router-dom';
import { XCircle } from 'lucide-react';
import Button from '@/components/ui/Button';

export default function CheckoutCanceled() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        <div className="mb-6">
          <XCircle className="w-16 h-16 text-red-500 mx-auto" />
        </div>
        
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          Paiement annulé
        </h1>
        
        <p className="text-gray-600 mb-8">
          Le processus de paiement a été interrompu. Aucun montant n'a été débité.
        </p>

        <div className="space-y-4">
          <Button
            onClick={() => navigate('/pricing')}
            className="w-full"
          >
            Retourner aux tarifs
          </Button>
          
          <Button
            variant="outline"
            onClick={() => navigate('/')}
            className="w-full"
          >
            Retour à l'accueil
          </Button>
        </div>
      </div>
    </div>
  );
}