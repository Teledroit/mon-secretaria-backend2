import { Calendar, MessageSquare, Phone, Settings, Clock, Brain, Shield, Zap } from 'lucide-react';

const features = [
  {
    icon: Calendar,
    title: "Gestion Intelligente des Rendez-vous",
    description: "Synchronisation parfaite avec Calendly et votre agenda. Optimisation automatique des créneaux disponibles."
  },
  {
    icon: MessageSquare,
    title: "Personnalisation Vocale Avancée",
    description: "Choisissez la voix, le ton et la personnalité de votre assistant pour une expérience sur mesure."
  },
  {
    icon: Phone,
    title: "Gestion d'Appels Professionnelle",
    description: "Détection de messagerie vocale, gestion des silences et des interruptions avec une précision remarquable."
  },
  {
    icon: Brain,
    title: "IA Conversationnelle Évoluée",
    description: "Compréhension contextuelle approfondie et réponses naturelles adaptées à votre domaine juridique."
  },
  {
    icon: Shield,
    title: "Sécurité & Confidentialité",
    description: "Protection des données et respect strict du secret professionnel pour vos communications."
  },
  {
    icon: Clock,
    title: "Disponibilité 24/7",
    description: "Un accueil téléphonique professionnel sans interruption, même pendant les congés."
  },
  {
    icon: Zap,
    title: "Transfert Intelligent",
    description: "Redirection contextuelle des appels selon vos règles et priorités définies."
  },
  {
    icon: Settings,
    title: "Configuration Flexible",
    description: "Interface intuitive pour ajuster les paramètres et comportements de votre assistant."
  }
];

export default function Features() {
  return (
    <section id="features" className="py-24 bg-gradient-to-b from-white to-gray-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4">
            <span className="gradient-text">Fonctionnalités</span> Avancées
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Une solution complète pour moderniser votre accueil téléphonique et
            optimiser la gestion de vos communications.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <div key={index} className="feature-card">
              <div className="mb-4 inline-block p-3 bg-gradient-to-br from-blue-100 to-purple-100 rounded-lg">
                <feature.icon className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
              <p className="text-gray-600">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}