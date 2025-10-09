import { useState } from 'react';
import { Phone, Mic, Settings, Volume2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import VoiceTab from './Demo/VoiceTab';
import SettingsTab from './Demo/SettingsTab';
import CallsTab from './Demo/CallsTab';
import AudioTab from './Demo/AudioTab';
import Preview from './Demo/Preview';

export default function Demo() {
  const [activeTab, setActiveTab] = useState('voice');
  const [voiceType, setVoiceType] = useState('Femme - Professionnelle (25-35 ans)');
  const [welcomeMessage, setWelcomeMessage] = useState(
    "Bonjour, vous êtes en communication avec l'assistant virtuel du cabinet. Comment puis-je vous aider ?"
  );

  const tabs = [
    { id: 'voice', label: 'Voix', icon: Mic, component: VoiceTab },
    { id: 'settings', label: 'Paramètres', icon: Settings, component: SettingsTab },
    { id: 'calls', label: 'Appels', icon: Phone, component: CallsTab },
    { id: 'audio', label: 'Audio', icon: Volume2, component: AudioTab },
  ];

  const ActiveComponent = tabs.find(tab => tab.id === activeTab)?.component || VoiceTab;

  return (
    <section id="demo-section" className="py-24 bg-gradient-to-br from-blue-50 to-purple-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <motion.h2 
            className="text-4xl font-bold mb-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            Découvrez votre futur <span className="gradient-text">Assistant</span>
          </motion.h2>
          <motion.p 
            className="text-xl text-gray-600 max-w-2xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            Personnalisez votre assistant virtuel selon vos préférences et
            découvrez comment il gère les appels en temps réel. Transcription textuelle intégrale de l'audio de chaque conversation.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
          <motion.div 
            className="bg-white rounded-2xl shadow-xl p-8"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
          >
            <div className="flex space-x-4 mb-8 overflow-x-auto pb-2">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center px-4 py-2 rounded-lg transition-all whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'bg-blue-100 text-blue-600'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <tab.icon className="w-5 h-5 mr-2" />
                  {tab.label}
                </button>
              ))}
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="bg-gray-50 rounded-xl p-6"
              >
                <ActiveComponent
                  onVoiceTypeChange={setVoiceType}
                  onWelcomeMessageChange={setWelcomeMessage}
                />
              </motion.div>
            </AnimatePresence>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6 }}
            className="relative"
          >
            <div className="absolute -top-12 -left-12 w-64 h-64 rounded-full overflow-hidden shadow-xl border-4 border-white">
              <img
                src="https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?auto=format&fit=crop&w=500&q=80"
                alt="Standardiste professionnelle"
                className="w-full h-full object-cover"
              />
            </div>
            <Preview
              voiceType={voiceType}
              welcomeMessage={welcomeMessage}
            />
          </motion.div>
        </div>
      </div>
    </section>
  );
}