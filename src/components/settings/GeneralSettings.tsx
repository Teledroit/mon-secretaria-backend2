import { ChangeEvent } from 'react';
import { Save } from 'lucide-react';
import Button from '@/components/ui/Button';

interface GeneralSettingsProps {
  settings: {
    welcomeMessage: string;
    voiceType: string;
    latency: number;
    interruptionSensitivity: number;
    enableBackchanneling: boolean;
    maxCallDuration: number;
    silenceTimeout: number;
    detectVoicemail: boolean;
    enableSpeechNormalization: boolean;
    transferNumber?: string;
    workingHours: {
      start: string;
      end: string;
      workingDays: string[];
    };
    notifications: {
      email: boolean;
      sms: boolean;
    };
  };
  onSettingsChange: (settings: any) => void;
  onSubmit: (settings: any) => void;
}

export default function GeneralSettings({ 
  settings, 
  onSettingsChange,
  onSubmit 
}: GeneralSettingsProps) {
  const handleChange = (field: string, value: any) => {
    const newSettings = { ...settings, [field]: value };
    onSettingsChange(newSettings);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Prevent default form submission and call onSubmit with current settings
    onSubmit(e);
  };

  // Ensure workingDays is always an array
  const workingDays = settings.workingHours?.workingDays ?? [];

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
      <h2 className="text-lg font-medium mb-4">Paramètres Généraux</h2>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Message d'accueil
          </label>
          <textarea
            value={settings.welcomeMessage}
            onChange={(e) => handleChange('welcomeMessage', e.target.value)}
            rows={3}
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Réactivité
          </label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={settings.latency}
            onChange={(e) => handleChange('latency', parseFloat(e.target.value))}
            className="w-full"
          />
          <div className="flex justify-between text-sm text-gray-500 mt-1">
            <span>Latence élevée</span>
            <span>Latence faible</span>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Sensibilité aux interruptions
          </label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={settings.interruptionSensitivity}
            onChange={(e) => handleChange('interruptionSensitivity', parseFloat(e.target.value))}
            className="w-full"
          />
          <div className="flex justify-between text-sm text-gray-500 mt-1">
            <span>Faible</span>
            <span>Élevée</span>
          </div>
        </div>

        <div>
          <label className="flex items-center space-x-3">
            <input
              type="checkbox"
              checked={settings.enableBackchanneling}
              onChange={(e) => handleChange('enableBackchanneling', e.target.checked)}
              className="rounded text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm font-medium text-gray-700">
              Activer le backchanneling (signaux d'écoute active)
            </span>
          </label>
          <p className="mt-1 text-sm text-gray-500 ml-6">
            L'assistant utilisera des expressions comme "oui", "d'accord", "je vois" pour maintenir un dialogue naturel
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Durée maximale d'appel (minutes)
          </label>
          <input
            type="range"
            min="1"
            max="60"
            value={settings.maxCallDuration}
            onChange={(e) => handleChange('maxCallDuration', parseInt(e.target.value))}
            className="w-full"
          />
          <div className="flex justify-between text-sm text-gray-500 mt-1">
            <span>1 min</span>
            <span>{settings.maxCallDuration} min</span>
            <span>60 min</span>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Mettre fin à l'appel en cas de silence (minutes)
          </label>
          <input
            type="range"
            min="1"
            max="20"
            value={settings.silenceTimeout}
            onChange={(e) => handleChange('silenceTimeout', parseInt(e.target.value))}
            className="w-full"
          />
          <div className="flex justify-between text-sm text-gray-500 mt-1">
            <span>1 min</span>
            <span>{settings.silenceTimeout} min</span>
            <span>20 min</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Heure de début
            </label>
            <input
              type="time"
              value={settings.workingHours?.start}
              onChange={(e) => handleChange('workingHours', {
                ...settings.workingHours,
                start: e.target.value
              })}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Heure de fin
            </label>
            <input
              type="time"
              value={settings.workingHours?.end}
              onChange={(e) => handleChange('workingHours', {
                ...settings.workingHours,
                end: e.target.value
              })}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Jours de service
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { id: 'monday', label: 'Lundi' },
              { id: 'tuesday', label: 'Mardi' },
              { id: 'wednesday', label: 'Mercredi' },
              { id: 'thursday', label: 'Jeudi' },
              { id: 'friday', label: 'Vendredi' },
              { id: 'saturday', label: 'Samedi' },
              { id: 'sunday', label: 'Dimanche' }
            ].map((day) => (
              <label key={day.id} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={workingDays.includes(day.id)}
                  onChange={(e) => {
                    const newDays = e.target.checked
                      ? [...workingDays, day.id]
                      : workingDays.filter(d => d !== day.id);
                    const newWorkingHours = {
                      ...settings.workingHours,
                      workingDays: newDays
                    };
                    handleChange('workingHours', newWorkingHours);
                  }}
                  className="rounded text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">{day.label}</span>
              </label>
            ))}
          </div>
          <p className="mt-1 text-sm text-gray-500">
            Sélectionnez les jours où le service sera actif
          </p>
        </div>

        <div>
          <label className="flex items-center space-x-3">
            <input
              type="checkbox"
              checked={settings.detectVoicemail}
              onChange={(e) => handleChange('detectVoicemail', e.target.checked)}
              className="rounded text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm font-medium text-gray-700">
              Mettre fin à l'appel quand un répondeur est détecté
            </span>
          </label>
        </div>

        <div>
          <label className="flex items-center space-x-3">
            <input
              type="checkbox"
              checked={settings.enableSpeechNormalization}
              onChange={(e) => handleChange('enableSpeechNormalization', e.target.checked)}
              className="rounded text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm font-medium text-gray-700">
              Activer la normalisation de la parole
            </span>
          </label>
          <p className="mt-1 text-sm text-gray-500 ml-6">
            Convertit automatiquement les nombres, dates et devises en texte naturel, et évite les erreurs de formatage (ex: numéros de téléphone lus comme des dates)
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Numéro de transfert
          </label>
          <input
            type="tel"
            value={settings.transferNumber}
            onChange={(e) => handleChange('transferNumber', e.target.value)}
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            placeholder="+33 1 23 45 67 89"
          />
        </div>

        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-2">Notifications</h3>
          <div className="space-y-2">
            <label className="flex items-center space-x-3">
              <input
                type="checkbox"
                checked={settings.notifications?.email}
                onChange={(e) => handleChange('notifications', {
                  ...settings.notifications,
                  email: e.target.checked
                })}
                className="rounded text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">Notifications par email</span>
            </label>

            <label className="flex items-center space-x-3">
              <input
                type="checkbox"
                checked={settings.notifications?.sms}
                onChange={(e) => handleChange('notifications', {
                  ...settings.notifications,
                  sms: e.target.checked
                })}
                className="rounded text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">Notifications par SMS</span>
            </label>
          </div>
        </div>

        <div className="flex justify-end">
          <Button type="submit" className="flex items-center space-x-2">
            <Save className="w-4 h-4" />
            <span>Enregistrer les modifications</span>
          </Button>
        </div>
      </form>
    </div>
  );
}

export { GeneralSettings }