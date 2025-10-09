import { useState } from 'react';
import { Network, Phone, AlertCircle } from 'lucide-react';
import Button from '@/components/ui/Button';
import { twilioIntegration } from '@/lib/integrations/twilio';

interface SIPConfig {
  phoneNumber: string;
  terminationUri: string;
  username: string;
  password: string;
  nickname?: string;
  existingNumber?: string;
  forwardingEnabled: boolean;
}

export default function ConnectSIP() {
  const [config, setConfig] = useState<SIPConfig>({
    phoneNumber: '',
    terminationUri: '',
    username: '',
    password: '',
    nickname: '',
    existingNumber: '',
    forwardingEnabled: false
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      await twilioIntegration.configureSIP({
        phoneNumber: config.phoneNumber,
        terminationUri: config.terminationUri,
        username: config.username,
        password: config.password,
        nickname: config.nickname || undefined
      });

      setSuccess('Configuration SIP enregistrée avec succès');
      setConfig({
        phoneNumber: '',
        terminationUri: '',
        username: '',
        password: '',
        nickname: '',
        existingNumber: '',
        forwardingEnabled: false
      });
    } catch (err) {
      console.error('Error saving SIP config:', err);
      setError('Erreur lors de l\'enregistrement de la configuration SIP');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-50 p-4 rounded-lg flex items-center gap-2 text-red-700">
          <AlertCircle className="w-5 h-5" />
          <p>{error}</p>
        </div>
      )}
      
      {success && (
        <div className="bg-green-50 p-4 rounded-lg flex items-center gap-2 text-green-700">
          <AlertCircle className="w-5 h-5" />
          <p>{success}</p>
        </div>
      )}

      <div className="bg-blue-50 p-4 rounded-lg">
        <h3 className="font-medium text-blue-900 mb-2">Redirection de numéro existant</h3>
        <div className="space-y-4">
          <label className="flex items-center space-x-3">
            <input
              type="checkbox"
              checked={config.forwardingEnabled}
              onChange={(e) => setConfig({ ...config, forwardingEnabled: e.target.checked })}
              className="rounded text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-blue-900">Activer la redirection d'un numéro existant</span>
          </label>

          {config.forwardingEnabled && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Votre numéro de téléphone actuel
              </label>
              <div className="flex gap-2">
                <input
                  type="tel"
                  value={config.existingNumber}
                  onChange={(e) => setConfig({ ...config, existingNumber: e.target.value })}
                  placeholder="+33123456789"
                  className="flex-1 rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
                <Button type="button" variant="outline" size="sm">
                  Vérifier
                </Button>
              </div>
              <p className="mt-1 text-sm text-gray-500">
                Ce numéro sera redirigé vers notre assistant IA
              </p>
            </div>
          )}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Numéro de téléphone SIP
        </label>
        <input
          type="tel"
          value={config.phoneNumber}
          onChange={(e) => setConfig({ ...config, phoneNumber: e.target.value })}
          placeholder="+33123456789"
          className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          URI de terminaison
        </label>
        <input
          type="text"
          value={config.terminationUri}
          onChange={(e) => setConfig({ ...config, terminationUri: e.target.value })}
          placeholder="sip:example.com"
          className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Nom d'utilisateur SIP
        </label>
        <input
          type="text"
          value={config.username}
          onChange={(e) => setConfig({ ...config, username: e.target.value })}
          className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Mot de passe SIP
        </label>
        <input
          type="password"
          value={config.password}
          onChange={(e) => setConfig({ ...config, password: e.target.value })}
          className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Surnom (optionnel)
        </label>
        <input
          type="text"
          value={config.nickname}
          onChange={(e) => setConfig({ ...config, nickname: e.target.value })}
          placeholder="Ex: Bureau principal"
          className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
        />
      </div>

      <Button type="submit" className="w-full">
        <Network className="w-4 h-4 mr-2" />
        {isSubmitting 
          ? 'Enregistrement...' 
          : config.forwardingEnabled 
            ? 'Configurer la redirection' 
            : 'Connecter la ligne SIP'
        }
      </Button>
    </form>
  );
}