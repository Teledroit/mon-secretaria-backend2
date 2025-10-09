import { useState } from 'react';
import { Send, MessageSquare, Phone, AlertCircle } from 'lucide-react';
import Button from '@/components/ui/Button';
import { useAuth } from '@/lib/AuthContext';

export default function TestNotifications() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const triggerNotification = async (type: string, data: any) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/trigger-notification`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user?.id,
          type,
          data
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to trigger notification');
      }

      return await response.json();
    } catch (error) {
      console.error('Error triggering notification:', error);
      throw error;
    }
  };

  const sendSMS = async (phoneNumber: string, message: string) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/send-sms`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: phoneNumber,
          message,
          userId: user?.id
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to send SMS');
      }

      return await response.json();
    } catch (error) {
      console.error('Error sending SMS:', error);
      throw error;
    }
  };

  const testNotification = async (type: 'appointment_booked' | 'urgent_call' | 'important_request') => {
    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      let data;
      switch (type) {
        case 'appointment_booked':
          data = {
            clientName: 'Marie Dupont',
            date: '2024-03-25',
            time: '14:30'
          };
          break;
        case 'urgent_call':
          data = {
            clientName: 'Jean Martin',
            phoneNumber: '+33123456789'
          };
          break;
        case 'important_request':
          data = {
            clientName: 'Sophie Bernard',
            subject: 'Dossier urgent - Divorce',
            importance: 'high' as const
          };
          break;
      }

      const response = await triggerNotification(type, data);
      setResult(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
    } finally {
      setIsLoading(false);
    }
  };

  const testDirectSMS = async () => {
    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await sendSMS('+33123456789', 'Test SMS depuis MonSecretarIA - Système de notification opérationnel');
      setResult(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
      <h2 className="text-lg font-medium mb-6">Test des Notifications</h2>
      
      <div className="bg-blue-50 p-4 rounded-lg mb-6">
        <h3 className="font-medium text-blue-900 mb-2">📧 Adresses email personnalisées</h3>
        <p className="text-sm text-blue-800">
          Si vous avez configuré des adresses email spécifiques dans l'onglet "Notifications", 
          les tests utiliseront ces adresses. Sinon, l'email de votre compte sera utilisé.
        </p>
      </div>
      
      <div className="space-y-4 mb-6">
        <Button
          onClick={() => testNotification('appointment_booked')}
          disabled={isLoading}
          className="w-full flex items-center justify-center"
        >
          <MessageSquare className="w-4 h-4 mr-2" />
          Tester notification rendez-vous
        </Button>

        <Button
          onClick={() => testNotification('urgent_call')}
          disabled={isLoading}
          className="w-full flex items-center justify-center bg-red-600 hover:bg-red-700"
        >
          <Phone className="w-4 h-4 mr-2" />
          Tester appel urgent
        </Button>

        <Button
          onClick={() => testNotification('important_request')}
          disabled={isLoading}
          className="w-full flex items-center justify-center bg-orange-600 hover:bg-orange-700"
        >
          <AlertCircle className="w-4 h-4 mr-2" />
          Tester demande importante
        </Button>

        <Button
          onClick={testDirectSMS}
          disabled={isLoading}
          variant="outline"
          className="w-full flex items-center justify-center"
        >
          <Send className="w-4 h-4 mr-2" />
          Tester SMS direct
        </Button>
      </div>

      {isLoading && (
        <div className="text-center py-4">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-sm text-gray-600">Envoi en cours...</p>
        </div>
      )}

      {error && (
        <div className="bg-red-50 p-4 rounded-lg mb-4">
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      {result && (
        <div className="bg-green-50 p-4 rounded-lg">
          <h3 className="font-medium text-green-800 mb-2">Résultat :</h3>
          <pre className="text-sm text-green-700 overflow-auto">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}