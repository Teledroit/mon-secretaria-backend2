import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import AIConfiguration from '@/components/settings/AIConfiguration';
import DocumentsConfig from '@/components/settings/DocumentsConfig';
import WorkflowConfig from '@/components/settings/WorkflowConfig';
import PrivacySettings from '@/components/settings/PrivacySettings';
import GeneralSettings, { GeneralSettings as GeneralSettingsType } from '@/components/settings/GeneralSettings';

export default function Settings() {
  const [configuration, setConfiguration] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchConfiguration();
  }, []);

  const fetchConfiguration = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Fetch existing configuration with maybeSingle to avoid cache issues
      const { data, error } = await supabase
        .from('configurations')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        if (error.code === 'PGRST116') {
          // No configuration exists, create default one
          const { data: newConfig, error: insertError } = await supabase
            .from('configurations')
            .insert({
              user_id: user.id,
              tts_engine: 'elevenlabs',
              nlp_engine: 'gpt-4',
              voice_id: 'EXAVITQu4vr4xnSDxMaL',
              temperature: 0.7,
              welcome_message: "Bonjour, vous êtes en communication avec l'assistant virtuel du cabinet. Comment puis-je vous aider ?",
              privacy_settings: {}
            })
            .select()
            .single();

          if (insertError) throw insertError;
          setConfiguration(newConfig);
        } else {
          throw error;
        }
      } else {
        setConfiguration(data);
      }
    } catch (error) {
      console.error('Error fetching configuration:', error);
      setError('Failed to load configuration');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAIConfigSave = async (aiConfig: any) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('User not authenticated');
      }

      const { data: updatedConfig, error } = await supabase
        .from('configurations')
        .upsert({
          id: configuration?.id,
          user_id: user.id,
          tts_engine: aiConfig.ttsEngine,
          nlp_engine: aiConfig.nlpEngine,
          voice_id: aiConfig.ttsEngine === 'elevenlabs' ? aiConfig.voiceId : null,
          temperature: aiConfig.temperature,
          system_instructions: aiConfig.systemInstructions,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'id'
        })
        .select()
        .single();

      if (error) throw error;

      console.log('AI Config saved successfully:', updatedConfig);

      // Use the data returned from the database to update local state
      setConfiguration(updatedConfig);
    } catch (error) {
      console.error('Error saving AI configuration:', error);
      throw error;
    }
  };

  const handlePrivacySettingsSave = async (privacySettings: any) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('User not authenticated');
      }

      const { error } = await supabase
        .from('configurations')
        .update({
          privacy_settings: privacySettings,
          updated_at: new Date().toISOString()
        })
        .eq('id', configuration?.id)
        .eq('user_id', user.id);

      if (error) throw error;
      
      // Refresh configuration
      await fetchConfiguration();
    } catch (error) {
      console.error('Error saving privacy settings:', error);
      throw error;
    }
  };

  const handleGeneralSettingsSave = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        throw new Error('User not authenticated');
      }

      // Use the current configuration state which has been updated by onSettingsChange
      const { error } = await supabase
        .from('configurations')
        .update({
          welcome_message: configuration?.welcome_message,
          voice_type: configuration?.voice_type,
          detect_voicemail: configuration?.detect_voicemail,
          max_call_duration: configuration?.max_call_duration,
          silence_timeout: configuration?.silence_timeout,
          latency: configuration?.latency,
          interruption_sensitivity: configuration?.interruption_sensitivity,
          enable_backchanneling: configuration?.enable_backchanneling,
          enable_speech_normalization: configuration?.enable_speech_normalization,
          working_hours_start: configuration?.working_hours_start,
          working_hours_end: configuration?.working_hours_end,
          working_days: configuration?.working_days,
          transfer_number: configuration?.transfer_number,
          notifications_email: configuration?.notifications_email,
          notifications_sms: configuration?.notifications_sms,
          updated_at: new Date().toISOString()
        })
        .eq('id', configuration?.id)
        .eq('user_id', user.id);

      if (error) throw error;

      // Update local state to reflect saved changes
      setConfiguration(prev => ({
        ...prev,
        updated_at: new Date().toISOString()
      }));

      // Show success message
      alert('Paramètres sauvegardés avec succès !');
    } catch (error) {
      console.error('Error saving general settings:', error);
      alert('Erreur lors de la sauvegarde des paramètres');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-gray-900">Configuration</h1>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <AIConfiguration 
          onSave={handleAIConfigSave}
          initialConfig={{
            ttsEngine: configuration?.tts_engine,
            nlpEngine: configuration?.nlp_engine,
            voice: configuration?.voice_id || 'EXAVITQu4vr4xnSDxMaL',
            temperature: configuration?.temperature,
            systemInstructions: configuration?.system_instructions
          }}
        />
        <DocumentsConfig />
        <WorkflowConfig />
        <PrivacySettings onSave={handlePrivacySettingsSave} />
        <GeneralSettings 
          settings={{
            welcomeMessage: configuration?.welcome_message || "Bonjour, vous êtes en communication avec l'assistant virtuel du cabinet. Comment puis-je vous aider ?",
            voiceType: configuration?.voice_type ?? "female",
            latency: configuration?.latency || 0.5,
            interruptionSensitivity: configuration?.interruption_sensitivity || 0.7,
            enableBackchanneling: configuration?.enable_backchanneling ?? true,
            maxCallDuration: configuration?.max_call_duration || 20,
            silenceTimeout: configuration?.silence_timeout || 5,
            detectVoicemail: configuration?.detect_voicemail ?? true,
            enableSpeechNormalization: configuration?.enable_speech_normalization ?? true,
            transferNumber: configuration?.transfer_number ?? "",
            workingHours: {
              start: configuration?.working_hours_start ?? "09:00",
              end: configuration?.working_hours_end ?? "18:00",
              workingDays: configuration?.working_days || ["monday", "tuesday", "wednesday", "thursday", "friday"]
            },
            notifications: {
              email: configuration?.notifications_email ?? true,
              sms: configuration?.notifications_sms ?? false
            }
          }}
          onSettingsChange={(newSettings) => {
            // Update local state immediately for responsive UI
            setConfiguration(current => ({
              ...current,
              welcome_message: newSettings.welcomeMessage,
              voice_type: newSettings.voiceType,
              latency: newSettings.latency,
              interruption_sensitivity: newSettings.interruptionSensitivity,
              enable_backchanneling: newSettings.enableBackchanneling,
              max_call_duration: newSettings.maxCallDuration,
              silence_timeout: newSettings.silenceTimeout,
              detect_voicemail: newSettings.detectVoicemail,
              enable_speech_normalization: newSettings.enableSpeechNormalization,
              working_hours_start: newSettings.workingHours.start,
              working_hours_end: newSettings.workingHours.end,
              working_days: newSettings.workingHours.workingDays,
              transfer_number: newSettings.transferNumber,
              notifications_email: newSettings.notifications.email,
              notifications_sms: newSettings.notifications.sms
            }));
          }}
          onSubmit={handleGeneralSettingsSave}
        />
      </div>
    </div>
  );
}
