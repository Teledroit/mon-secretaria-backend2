import React, { useState, useEffect } from 'react';
import { Bell, Mail, MessageSquare, Settings, AlertTriangle, Calendar, Phone } from 'lucide-react';
import { useAuth } from '../../lib/AuthContext';
import { notificationIntegration } from '../../lib/integrations/notifications';
import { supabase } from '../../lib/supabase';

interface NotificationSettings {
  appointments: {
    enabled: boolean;
    sms: boolean;
    email: boolean;
    emailAddress?: string;
  };
  urgentCalls: {
    enabled: boolean;
    sms: boolean;
    email: boolean;
    emailAddress?: string;
  };
  importantRequests: {
    enabled: boolean;
    email: boolean;
    emailAddress?: string;
    threshold: 'medium' | 'high';
  };
}

const defaultNotificationSettings: NotificationSettings = {
  appointments: {
    enabled: true,
    sms: true,
    email: true,
    emailAddress: ''
  },
  urgentCalls: {
    enabled: true,
    sms: true,
    email: true,
    emailAddress: ''
  },
  importantRequests: {
    enabled: true,
    email: true,
    emailAddress: '',
    threshold: 'high'
  }
};

// Deep merge function to combine default settings with fetched data
const deepMerge = (target: any, source: any): any => {
  const result = { ...target };
  for (const key in source) {
    if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
      result[key] = deepMerge(target[key] || {}, source[key]);
    } else {
      result[key] = source[key];
    }
  }
  return result;
};

export default function Notifications() {
  const { user } = useAuth();
  const [settings, setSettings] = useState<NotificationSettings>(defaultNotificationSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);

  useEffect(() => {
    loadSettings();
  }, [user]);

  const loadSettings = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('configurations')
        .select('notifications')
        .eq('user_id', user.id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No configuration exists, create default one
          const defaultConfig = {
            user_id: user.id,
            notifications: defaultNotificationSettings
          };
          
          const { error: insertError } = await supabase
            .from('configurations')
            .insert(defaultConfig);
            
          if (insertError) {
            console.error('Error creating default configuration:', insertError);
          }
          setSettings(defaultNotificationSettings);
        } else {
          console.error('Error loading settings:', error);
        }
        return;
      }

      if (data?.notifications) {
        // Deep merge fetched data with default settings to ensure all properties exist
        const mergedSettings = deepMerge(defaultNotificationSettings, data.notifications);
        setSettings(mergedSettings);
      } else {
        setSettings(defaultNotificationSettings);
      }
    } catch (error) {
      console.error('Error loading notification settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    if (!user) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('configurations')
        .upsert({
          user_id: user.id,
          notifications: settings
        });

      if (error) {
        console.error('Error saving settings:', error);
        alert('Erreur lors de la sauvegarde des paramètres');
      } else {
        alert('Paramètres sauvegardés avec succès !');
      }
    } catch (error) {
      console.error('Error saving notification settings:', error);
      alert('Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  const updateSettings = (category: keyof NotificationSettings, field: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [field]: value
      }
    }));
  };

  const triggerTestNotification = async (type: string, data: any) => {
    try {
      const response = await notificationIntegration.triggerNotification(type, data);
      setTestResult(`Test envoyé avec succès: ${JSON.stringify(response, null, 2)}`);
      setTimeout(() => setTestResult(null), 5000);
    } catch (error) {
      console.error('Error sending test notification:', error);
      setTestResult(`Erreur: ${error.message}`);
      setTimeout(() => setTestResult(null), 5000);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex items-center mb-6">
            <Bell className="h-6 w-6 text-blue-600 mr-3" />
            <h3 className="text-lg font-medium text-gray-900">
              Paramètres de notification
            </h3>
          </div>

          <div className="space-y-8">
            {/* Rendez-vous */}
            <div className="border-b border-gray-200 pb-6">
              <div className="flex items-center mb-4">
                <Calendar className="h-5 w-5 text-green-600 mr-2" />
                <h4 className="text-md font-medium text-gray-900">Rendez-vous</h4>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="appointments-enabled"
                    checked={settings.appointments.enabled}
                    onChange={(e) => updateSettings('appointments', 'enabled', e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="appointments-enabled" className="ml-2 text-sm text-gray-700">
                    Activer les notifications pour les nouveaux rendez-vous
                  </label>
                </div>

                {settings.appointments.enabled && (
                  <div className="ml-6 space-y-3">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="appointments-sms"
                        checked={settings.appointments.sms}
                        onChange={(e) => updateSettings('appointments', 'sms', e.target.checked)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <MessageSquare className="h-4 w-4 text-blue-600 ml-2 mr-1" />
                      <label htmlFor="appointments-sms" className="text-sm text-gray-700">
                        Notification par SMS
                      </label>
                    </div>

                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="appointments-email"
                        checked={settings.appointments.email}
                        onChange={(e) => updateSettings('appointments', 'email', e.target.checked)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <Mail className="h-4 w-4 text-blue-600 ml-2 mr-1" />
                      <label htmlFor="appointments-email" className="text-sm text-gray-700">
                        Notification par email
                      </label>
                    </div>

                    {settings.appointments.email && (
                      <div className="ml-6">
                        <input
                          type="email"
                          placeholder="Laisser vide pour utiliser l'email du compte"
                          value={settings.appointments.emailAddress || ''}
                          onChange={(e) => updateSettings('appointments', 'emailAddress', e.target.value)}
                          className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Appels urgents */}
            <div className="border-b border-gray-200 pb-6">
              <div className="flex items-center mb-4">
                <AlertTriangle className="h-5 w-5 text-red-600 mr-2" />
                <h4 className="text-md font-medium text-gray-900">Appels urgents</h4>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="urgent-enabled"
                    checked={settings.urgentCalls.enabled}
                    onChange={(e) => updateSettings('urgentCalls', 'enabled', e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="urgent-enabled" className="ml-2 text-sm text-gray-700">
                    Activer les notifications pour les appels urgents
                  </label>
                </div>

                {settings.urgentCalls.enabled && (
                  <div className="ml-6 space-y-3">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="urgent-sms"
                        checked={settings.urgentCalls.sms}
                        onChange={(e) => updateSettings('urgentCalls', 'sms', e.target.checked)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <MessageSquare className="h-4 w-4 text-blue-600 ml-2 mr-1" />
                      <label htmlFor="urgent-sms" className="text-sm text-gray-700">
                        Notification par SMS
                      </label>
                    </div>

                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="urgent-email"
                        checked={settings.urgentCalls.email}
                        onChange={(e) => updateSettings('urgentCalls', 'email', e.target.checked)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <Mail className="h-4 w-4 text-blue-600 ml-2 mr-1" />
                      <label htmlFor="urgent-email" className="text-sm text-gray-700">
                        Notification par email
                      </label>
                    </div>

                    {settings.urgentCalls.email && (
                      <div className="ml-6">
                        <input
                          type="email"
                          placeholder="Laisser vide pour utiliser l'email du compte"
                          value={settings.urgentCalls.emailAddress || ''}
                          onChange={(e) => updateSettings('urgentCalls', 'emailAddress', e.target.value)}
                          className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Demandes importantes */}
            <div className="pb-6">
              <div className="flex items-center mb-4">
                <Settings className="h-5 w-5 text-orange-600 mr-2" />
                <h4 className="text-md font-medium text-gray-900">Demandes importantes</h4>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="important-enabled"
                    checked={settings.importantRequests.enabled}
                    onChange={(e) => updateSettings('importantRequests', 'enabled', e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="important-enabled" className="ml-2 text-sm text-gray-700">
                    Activer les notifications pour les demandes importantes
                  </label>
                </div>

                {settings.importantRequests.enabled && (
                  <div className="ml-6 space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Seuil d'importance
                      </label>
                      <select
                        value={settings.importantRequests.threshold}
                        onChange={(e) => updateSettings('importantRequests', 'threshold', e.target.value)}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      >
                        <option value="medium">Moyen et plus</option>
                        <option value="high">Élevé uniquement</option>
                      </select>
                    </div>

                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="important-email"
                        checked={settings.importantRequests.email}
                        onChange={(e) => updateSettings('importantRequests', 'email', e.target.checked)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <Mail className="h-4 w-4 text-blue-600 ml-2 mr-1" />
                      <label htmlFor="important-email" className="text-sm text-gray-700">
                        Notification par email
                      </label>
                    </div>

                    {settings.importantRequests.email && (
                      <div className="ml-6">
                        <input
                          type="email"
                          placeholder="Laisser vide pour utiliser l'email du compte"
                          value={settings.importantRequests.emailAddress || ''}
                          onChange={(e) => updateSettings('importantRequests', 'emailAddress', e.target.value)}
                          className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <button
              onClick={saveSettings}
              disabled={saving}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {saving ? 'Sauvegarde...' : 'Sauvegarder'}
            </button>
          </div>
        </div>
      </div>

      {/* Test Section */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex items-center mb-4">
            <Phone className="h-6 w-6 text-purple-600 mr-3" />
            <h3 className="text-lg font-medium text-gray-900">
              Test des notifications
            </h3>
          </div>
          
          <p className="text-sm text-gray-600 mb-4">
            Utilisez ces boutons pour tester vos paramètres de notification.
          </p>
          
          <div className="space-y-3">
            <button
              onClick={() => {
                triggerTestNotification('appointment_booked', {
                  clientName: 'Marie Dupont',
                  date: '2024-03-25',
                  time: '14:30'
                });
              }}
              className="w-full sm:w-auto inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <Calendar className="h-4 w-4 mr-2" />
              Tester notification rendez-vous
            </button>
            
            <button
              onClick={() => {
                triggerTestNotification('urgent_call', {
                  clientName: 'Jean Martin',
                  phoneNumber: '+33123456789'
                });
              }}
              className="w-full sm:w-auto inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ml-0 sm:ml-3"
            >
              <AlertTriangle className="h-4 w-4 mr-2" />
              Tester notification urgente
            </button>
          </div>
          
          {testResult && (
            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <pre className="text-xs text-blue-800 whitespace-pre-wrap">{testResult}</pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}