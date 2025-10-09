import { motion } from 'framer-motion';
import { Phone, User, Bot } from 'lucide-react';

interface Message {
  type: 'assistant' | 'user';
  content: string;
}

interface PreviewProps {
  voiceType: string;
  welcomeMessage: string;
}

export default function Preview({ voiceType, welcomeMessage }: PreviewProps) {
  const messages: Message[] = [
    { type: 'assistant', content: welcomeMessage },
    { type: 'user', content: "Bonjour, j'aimerais prendre rendez-vous." },
    { type: 'assistant', content: "Je peux vous aider à planifier un rendez-vous. Quel type de consultation souhaitez-vous ?" }
  ];

  return (
    <div className="bg-white rounded-lg shadow-lg p-4 max-w-md mx-auto">
      <div className="flex items-center justify-between mb-4 pb-3 border-b">
        <div className="flex items-center space-x-2">
          <Phone className="w-5 h-5 text-green-500" />
          <span className="font-medium">Appel en cours</span>
        </div>
        <span className="text-sm text-gray-500">{voiceType}</span>
      </div>

      <div className="space-y-4">
        {messages.map((message, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.5 }}
            className={`flex items-start space-x-2 ${
              message.type === 'assistant' ? 'justify-start' : 'justify-end'
            }`}
          >
            {message.type === 'assistant' && (
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                <Bot className="w-5 h-5 text-blue-600" />
              </div>
            )}
            <div
              className={`rounded-lg p-3 max-w-[80%] ${
                message.type === 'assistant'
                  ? 'bg-blue-50 text-blue-900'
                  : 'bg-gray-100 text-gray-900'
              }`}
            >
              <p className="text-sm">{message.content}</p>
            </div>
            {message.type === 'user' && (
              <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                <User className="w-5 h-5 text-gray-600" />
              </div>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
}