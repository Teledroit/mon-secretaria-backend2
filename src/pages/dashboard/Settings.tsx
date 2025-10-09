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

      // Fetch existing configuration
      const { data, error } = await supabase
        .from('configurations')
        .select('*')
        .eq('user_id', user.id)
        .single();

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

      const { error } = await supabase
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
        });

      if (error) throw error;
      
      // Update local state first for immediate feedback
      setConfiguration(prev => ({
        ...prev,
        tts_engine: aiConfig.ttsEngine,
        nlp_engine: aiConfig.nlpEngine,
        voice_id: aiConfig.ttsEngine === 'elevenlabs' ? aiConfig.voiceId : null,
        temperature: aiConfig.temperature,
        system_instructions: aiConfig.systemInstructions
      }));

      // Then refresh from server
      fetchConfiguration();
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
    
    // Get the current settings from the configuration state
    const currentSettings = {
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
      notifications: configuration?.notifications || {
        email: configuration?.notifications_email ?? true,
        sms: configuration?.notifications_sms ?? false
      }
    };

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('User not authenticated');
      }

      const { error } = await supabase
        .from('configurations')
        .update({
          welcome_message: currentSettings.welcomeMessage,
          voice_type: currentSettings.voiceType,
          detect_voicemail: currentSettings.detectVoicemail,
          max_call_duration: currentSettings.maxCallDuration,
          silence_timeout: currentSettings.silenceTimeout,
          latency: currentSettings.latency,
          interruption_sensitivity: currentSettings.interruptionSensitivity,
          enable_backchanneling: currentSettings.enableBackchanneling,
          enable_speech_normalization: currentSettings.enableSpeechNormalization,
          working_hours_start: currentSettings.workingHours.start,
          working_hours_end: currentSettings.workingHours.end,
          working_days: currentSettings.workingHours.workingDays,
          transfer_number: currentSettings.transferNumber,
          notifications: {
            ...configuration?.notifications,
            general: currentSettings.notifications
          },
        }
        )
        .eq('id', configuration?.id)
        .eq('user_id', user.id);

      if (error) throw error;
      

      // Show success message
      alert('Paramètres sauvegardés avec succès !');
      
      // Refresh configuration from server
      fetchConfiguration();
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
            notifications: configuration?.notifications?.general || {
              email: true,
              sms: false
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
              notifications: {
                ...configuration?.notifications,
                general: newSettings.notifications
              }
            }));
          }}
          onSubmit={handleGeneralSettingsSave}
        />
      </div>
    </div>
  );
}