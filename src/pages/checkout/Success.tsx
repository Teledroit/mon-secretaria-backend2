import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle } from 'lucide-react';
import Button from '@/components/ui/Button';
import { supabase } from '@/lib/supabase';

export default function CheckoutSuccess() {
  const navigate = useNavigate();
  const [countdown, setCountdown] = useState(5);
  const [plan, setPlan] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const maxRetries = 5;
  const retryDelay = 2000; // 2 seconds

  useEffect(() => {
    const fetchSubscription = async () => {
      try {
        let attempts = 0;
        let subscription = null;

        while (attempts < maxRetries && !subscription) {
          const { data, error } = await supabase
            .from('stripe_user_subscriptions')
            .select('subscription_status, price_id')
            .single();

          if (error) {
            console.error('Error fetching subscription:', error);
          } else if (data) {
            subscription = data;
            break;
          }

          attempts++;
          await new Promise(resolve => setTimeout(resolve, retryDelay));
        }

        if (subscription) {
          setPlan(subscription.subscription_status === 'active' 
            ? 'Abonnement activé' 
            : 'Plan en cours d\'activation');
        } else {
          setPlan('Plan en cours d\'activation');
        }
      } catch (error) {
        console.error('Error fetching subscription:', error);
        setPlan('Plan en cours d\'activation');
      } finally {
        setIsLoading(false);
      }
    };

    fetchSubscription();
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(current => {
        if (current <= 1) {
          window.clearInterval(timer);
          navigate('/dashboard');
        }
        return current - 1;
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [navigate, countdown]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        <div className="mb-6">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto" />
        </div>
        
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Paiement réussi !
        </h1>
        <p className="text-lg text-gray-600 mb-4">
          Plan activé : {plan}
        </p>
        
        <p className="text-gray-600 mb-8">
          Merci pour votre confiance. Votre compte a été activé avec succès.
        </p>

        <p className="text-sm text-gray-500 mb-6">
          Redirection automatique dans {countdown} secondes...
        </p>

        <Button
          onClick={() => navigate('/dashboard')}
          className="w-full"
        >
          Accéder au tableau de bord
        </Button>
      </div>
    </div>
  );
}