import { useState } from 'react';
import { Calendar, Link as LinkIcon, User, AlertCircle, CheckCircle, X } from 'lucide-react';
import Button from '@/components/ui/Button';
import { 
  getAuthUrl, 
  getStoredCredentials, 
  clearStoredCredentials, 
  getConnectedUserEmail,
  revokeAccess 
} from '@/lib/calendar/auth';
import { supabase } from '@/lib/supabase';

interface CalendarConnectProps {
  isConnected?: boolean;
}

export default function CalendarConnect({ isConnected: propIsConnected }: CalendarConnectProps) {
  const [isConnecting, setIsConnecting] = useState(false);
  const [calendlyUrl, setCalendlyUrl] = useState('');
  const [showCalendlyInput, setShowCalendlyInput] = useState(false);
  const [isGoogleConnected, setIsGoogleConnected] = useState(false);
  const [connectedEmail, setConnectedEmail] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Check connection status on component mount
  useState(() => {
    const credentials = getStoredCredentials();
    const connected = !!credentials?.access_token;
    setIsGoogleConnected(connected);
    if (connected) {
      setConnectedEmail(getConnectedUserEmail());
    }
  });

  const handleGoogleConnect = async () => {
    setError(null);
    try {
      setIsConnecting(true);
      
      // Verify backend is accessible with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
      
      const healthCheck = await fetch(`${import.meta.env.VITE_BACKEND_URL}/health`, {
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      
      if (!healthCheck.ok) {
        throw new Error(`Backend non accessible (${healthCheck.status}). Veuillez réessayer plus tard.`);
      }
      
      console.log('Backend health check passed');
      
      const authUrl = getAuthUrl();
      console.log('Redirecting to Google OAuth:', authUrl);
      window.location.href = authUrl;
    } catch (error) {
      console.error('Error connecting to Google Calendar:', error);
      
      let errorMessage = 'Erreur de connexion inconnue';
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          errorMessage = 'Timeout - Le backend met trop de temps à répondre';
        } else if (error.message.includes('Failed to fetch')) {
          errorMessage = 'Impossible de contacter le backend. Vérifiez que le service est démarré sur Render.';
        } else {
          errorMessage = error.message;
        }
      }
      
      setError(errorMessage);
      setIsConnecting(false);
    }
  };

  const handleGoogleDisconnect = () => {
    revokeAccess();
    setIsGoogleConnected(false);
    setConnectedEmail(null);
    setError(null);
  };

  const handleCalendlyConnect = async () => {
    if (!calendlyUrl) return;
    
    try {
      // Save Calendly URL to user's configuration
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('configurations')
        .upsert({
          user_id: user.id,
          calendly_url: calendlyUrl,
          calendly_enabled: true,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;
      
      setShowCalendlyInput(false);
      alert('Calendly configuré avec succès !');
    } catch (error) {
      console.error('Error saving Calendly URL:', error);
      alert('Erreur lors de la sauvegarde de l\'URL Calendly');
    } finally {
      setIsConnecting(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
      <div className="flex items-center gap-2 mb-6">
        <Calendar className="w-5 h-5 text-blue-600" />
        <h2 className="text-lg font-medium">Intégration Calendrier</h2>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 rounded-lg flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-red-600" />
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}
      <div className="space-y-6">
        {/* Google Calendar Section */}
        <div className="p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-medium">Google Calendar</h3>
            {isGoogleConnected && (
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle className="w-4 h-4" />
                <span className="text-sm">Connecté</span>
              </div>
            )}
          </div>
          <p className="text-sm text-gray-600 mb-4">
            Synchronisez vos rendez-vous avec Google Calendar
          </p>
          
          {!isGoogleConnected ? (
            <div className="space-y-3">
              <Button
                onClick={handleGoogleConnect}
                disabled={true}
                className="flex items-center justify-center w-full"
              >
                <LinkIcon className="w-4 h-4 mr-2" />
                Bientôt disponible (sur demande)
              </Button>
              <div className="text-xs text-gray-500 bg-yellow-50 p-3 rounded border border-yellow-200">
                <p className="font-medium mb-1 text-yellow-800">🚧 Fonctionnalité en développement</p>
                <p className="text-yellow-700">
                  L'intégration Google Calendar sera disponible prochainement. 
                  Contactez-nous à <a href="mailto:contact.monsecretaria@gmail.com" className="underline">contact.monsecretaria@gmail.com</a> pour être notifié.
                </p>
              </div>
              <div className="text-xs text-gray-500 bg-blue-50 p-3 rounded">
                <p className="font-medium mb-1">Permissions demandées :</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Lecture et écriture de votre calendrier</li>
                  <li>Accès à votre adresse email (pour identification)</li>
                </ul>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-white p-4 rounded-lg border border-green-200">
                <div className="flex items-center gap-3 mb-2">
                  <User className="w-5 h-5 text-green-600" />
                  <span className="font-medium text-green-800">Compte connecté</span>
                </div>
                {connectedEmail && (
                  <p className="text-sm text-gray-600 mb-3">
                    📧 {connectedEmail}
                  </p>
                )}
                <p className="text-xs text-gray-500">
                  Vos rendez-vous seront automatiquement synchronisés avec ce compte Google Calendar.
                </p>
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  onClick={handleGoogleDisconnect}
                  className="flex items-center gap-2"
                >
                  <X className="w-4 h-4" />
                  Déconnecter
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => window.open('https://myaccount.google.com/permissions', '_blank')}
                  className="flex-1"
                >
                  Gérer les autorisations Google
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Calendly Section */}
        <div className="p-4 bg-gray-50 rounded-lg">
          <h3 className="font-medium mb-2">Calendly</h3>
          <p className="text-sm text-gray-600 mb-4">
            Intégrez votre lien Calendly pour la prise de rendez-vous
          </p>
          {!showCalendlyInput ? (
            <Button 
              onClick={() => setShowCalendlyInput(true)}
              className="w-full"
            >
              Configurer Calendly
            </Button>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Votre lien Calendly
                </label>
                <input
                  type="url"
                  value={calendlyUrl}
                  onChange={(e) => setCalendlyUrl(e.target.value)}
                  placeholder="https://calendly.com/votre-nom"
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowCalendlyInput(false)}
                >
                  Annuler
                </Button>
                <Button
                  onClick={handleCalendlyConnect}
                  disabled={!calendlyUrl}
                  className="flex-1"
                >
                  Enregistrer
                </Button>
              </div>
            </div>
          )}
        </div>
        
        {/* Information Section */}
        <div className="p-4 bg-blue-50 rounded-lg">
          <h3 className="font-medium text-blue-900 mb-2">💡 À propos de la synchronisation</h3>
          <div className="text-sm text-blue-800 space-y-2">
            <p>
              <strong>Google Calendar :</strong> Permet à l'assistant de vérifier vos disponibilités 
              en temps réel et de créer automatiquement des rendez-vous.
            </p>
            <p>
              <strong>Calendly :</strong> L'assistant enverra le lien Calendly par SMS aux clients 
              qui souhaitent prendre rendez-vous.
            </p>
            <p>
              <strong>Révocation :</strong> Vous pouvez révoquer l'accès à tout moment via le bouton 
              "Déconnecter\" ou directement dans vos paramètres Google.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}