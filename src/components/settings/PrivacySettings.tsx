import { useState, useEffect } from 'react';
import { Shield, AlertCircle } from 'lucide-react';
import Button from '@/components/ui/Button';
import { supabase } from '@/lib/supabase';

interface PrivacySettingsProps {
  onSave: (settings: PrivacySettings) => void;
}

interface PrivacySettings {
  storeSensitiveData: boolean;
  retentionPeriod: number;
  anonymizeTranscripts: boolean;
}

export default function PrivacySettings({ onSave }: PrivacySettingsProps) {
  const [settings, setSettings] = useState<PrivacySettings>({
    storeSensitiveData: false,
    retentionPeriod: 30,
    anonymizeTranscripts: true,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('configurations')
        .select('privacy_settings')
        .eq('user_id', user.id)
        .single();

      if (error) throw error;

      if (data?.privacy_settings) {
        setSettings(data.privacy_settings as PrivacySettings);
      }
    } catch (err) {
      console.error('Error loading privacy settings:', err);
      setError('Failed to load settings');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSaving(true);

    try {
      await onSave(settings);
    } catch (err) {
      console.error('Error saving privacy settings:', err);
      setError('Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
      <div className="flex items-center gap-2 mb-6">
        <Shield className="w-5 h-5 text-blue-600" />
        <h2 className="text-lg font-medium">Confidentialité des données</h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="flex items-center space-x-3">
            <input
              type="checkbox"
              checked={settings.storeSensitiveData}
              onChange={(e) => setSettings({
                ...settings,
                storeSensitiveData: e.target.checked
              })}
              className="rounded text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm font-medium text-gray-700">
              Autoriser le stockage des données sensibles
            </span>
          </label>
          <p className="mt-1 text-sm text-gray-500 ml-6">
            Active le stockage des informations confidentielles pour améliorer le service
          </p>
        </div>

        <div className="pl-6">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Durée de conservation (jours)
          </label>
          <select
            value={settings.retentionPeriod}
            onChange={(e) => setSettings({
              ...settings,
              retentionPeriod: parseInt(e.target.value)
            })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            disabled={!settings.storeSensitiveData}
          >
            <option value={7}>7 jours</option>
            <option value={30}>30 jours</option>
            <option value={90}>90 jours</option>
            <option value={180}>180 jours</option>
          </select>
        </div>

        <div>
          <label className="flex items-center space-x-3">
            <input
              type="checkbox"
              checked={settings.anonymizeTranscripts}
              onChange={(e) => setSettings({
                ...settings,
                anonymizeTranscripts: e.target.checked
              })}
              className="rounded text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm font-medium text-gray-700">
              Anonymiser les transcriptions
            </span>
          </label>
          <p className="mt-1 text-sm text-gray-500 ml-6">
            Masque automatiquement les informations personnelles dans les transcriptions
          </p>
        </div>

        {settings.storeSensitiveData && (
          <div className="bg-yellow-50 p-4 rounded-lg flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
            <div>
              <h3 className="text-sm font-medium text-yellow-800">
                Attention
              </h3>
              <p className="mt-1 text-sm text-yellow-700">
                Le stockage des données sensibles doit être conforme au RGPD et aux 
                réglementations locales. Assurez-vous d'avoir obtenu le consentement 
                nécessaire.
              </p>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 p-4 rounded-lg text-sm text-red-600">
            {error}
          </div>
        )}

        <Button 
          type="submit" 
          className="w-full"
          disabled={isSaving}
        >
          {isSaving ? 'Enregistrement...' : 'Enregistrer les paramètres de confidentialité'}
        </Button>
      </form>
    </div>
  );
}