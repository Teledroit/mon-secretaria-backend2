import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { handleAuthCallback, setStoredCredentials, getConnectedUserEmail } from '@/lib/calendar/auth';
import { CheckCircle, AlertCircle } from 'lucide-react';

export default function CalendarCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [error, setError] = useState<string>('');
  const [userEmail, setUserEmail] = useState<string>('');

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const code = searchParams.get('code');
        const error = searchParams.get('error');

        if (error) {
          throw new Error(`Erreur d'autorisation Google: ${error}`);
        }

        if (!code) {
          throw new Error('Aucun code d\'autorisation reçu de Google');
        }

        console.log('Processing authorization code...');
        
        // Exchange code for tokens
        const tokens = await handleAuthCallback(code);
        
        if (!tokens.access_token) {
          throw new Error('Aucun token d\'accès reçu');
        }

        console.log('Tokens received successfully');
        
        // Store credentials and get user email
        setStoredCredentials(tokens);
        const email = getConnectedUserEmail();
        if (email) {
          setUserEmail(email);
        }
        
        setStatus('success');

        // Redirect to appointments page after 2 seconds
        setTimeout(() => {
          navigate('/dashboard/appointments', { 
            state: { calendarConnected: true } 
          });
        }, 2000);

      } catch (err) {
        console.error('Calendar callback error:', err);
        
        let errorMessage = 'Erreur inconnue';
        if (err instanceof Error) {
          if (err.message.includes('Failed to fetch')) {
            errorMessage = 'Impossible de contacter le backend pour l\'échange de token. Vérifiez que le service backend est démarré sur Render.';
          } else if (err.message.includes('GOOGLE_CLIENT_SECRET')) {
            errorMessage = 'Configuration Google OAuth incomplète sur le serveur. Contactez le support.';
          } else {
            errorMessage = err.message;
          }
        }
        
        setError(errorMessage);
        setStatus('error');

        // Redirect to appointments page after 3 seconds even on error
        setTimeout(() => {
          navigate('/dashboard/appointments');
        }, 3000);
      }
    };

    handleCallback();
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        {status === 'loading' && (
          <>
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
            <h1 className="text-xl font-semibold text-gray-900 mb-2">
              Connexion à Google Calendar
            </h1>
            <p className="text-gray-600">
              Traitement de l'autorisation en cours...
            </p>
          </>
        )}

        {status === 'success' && (
          <>
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
            <h1 className="text-xl font-semibold text-gray-900 mb-2">
              Connexion réussie !
            </h1>
            <div className="text-gray-600 mb-4 space-y-2">
              <p>Votre Google Calendar a été connecté avec succès.</p>
              {userEmail && (
                <div className="bg-green-50 p-3 rounded-lg">
                  <p className="text-sm text-green-800">
                    📧 Compte connecté : {userEmail}
                  </p>
                </div>
              )}
            </div>
            <p className="text-sm text-gray-500">
              Redirection vers vos rendez-vous...
            </p>
          </>
        )}

        {status === 'error' && (
          <>
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h1 className="text-xl font-semibold text-gray-900 mb-2">
              Erreur de connexion
            </h1>
            <div className="text-gray-600 mb-4 space-y-2">
              <p className="text-red-600">{error}</p>
              <div className="bg-red-50 p-3 rounded-lg text-left">
                <p className="text-sm text-red-800 font-medium mb-2">Solutions possibles :</p>
                <ul className="text-xs text-red-700 space-y-1">
                  <li>• Vérifiez que votre backend est accessible</li>
                  <li>• Assurez-vous que GOOGLE_CLIENT_SECRET est configuré sur Render</li>
                  <li>• Vérifiez que FRONTEND_URL est correct sur Render</li>
                </ul>
              </div>
            </div>
            <p className="text-sm text-gray-500">
              Redirection vers vos rendez-vous...
            </p>
          </>
        )}
      </div>
    </div>
  );
}