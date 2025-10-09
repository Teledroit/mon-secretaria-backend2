import { Scale, Clock, Shield, Briefcase, UserCheck, Receipt } from 'lucide-react';

const benefits = [
  {
    icon: Scale,
    title: "Respect de la Déontologie",
    description: "Notre IA est formée spécifiquement pour respecter les règles déontologiques des avocats et le secret professionnel."
  },
  {
    icon: Clock,
    title: "Optimisation du Temps",
    description: "Gagnez jusqu'à 15 heures par mois en déléguant la gestion des appels à votre assistant virtuel."
  },
  {
    icon: Shield,
    title: "Confidentialité Garantie",
    description: "Toutes les conversations sont cryptées et traitées selon les normes les plus strictes de sécurité."
  },
  {
    icon: Briefcase,
    title: "Expertise Juridique",
    description: "L'assistant comprend le vocabulaire juridique et sait gérer les situations spécifiques à votre domaine."
  },
  {
    icon: UserCheck,
    title: "Qualification des Clients",
    description: "Identification précise des besoins des clients pour une meilleure préparation des consultations."
  },
  {
    icon: Receipt,
    title: "Rapports Détaillés",
    description: "Synthèses quotidiennes des appels et des actions requises pour un suivi optimal."
  }
];

export default function Benefits() {
  return (
    <section className="py-24 bg-gradient-to-br from-gray-50 to-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4">
            Conçu pour les <span className="gradient-text">Avocats</span>
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Une solution qui comprend les enjeux spécifiques de votre profession
            et s'adapte à vos besoins particuliers.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {benefits.map((benefit, index) => (
            <div 
              key={index}
              className="p-8 rounded-2xl bg-white shadow-xl hover:shadow-2xl transition-all duration-300
                         border border-gray-100 hover:border-blue-100"
            >
              <div className="mb-6 inline-block p-4 bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl">
                <benefit.icon className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold mb-3">{benefit.title}</h3>
              <p className="text-gray-600 leading-relaxed">{benefit.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}