import { motion } from 'framer-motion';
import { Clock, Notebook as Robot, PiggyBank, Smile } from 'lucide-react';

const benefits = [
  {
    icon: Robot,
    title: "Professionnalisme constant",
    description: "Un assistant qui maintient le même niveau d'excellence, sans variations émotionnelles ni baisse de performance."
  },
  {
    icon: Clock,
    title: "Disponibilité 24/7/365",
    description: "Toujours présent, même pendant les vacances, jours fériés et week-ends, sans surcoût."
  },
  {
    icon: PiggyBank,
    title: "Économies significatives",
    description: "Un coût fixe et prévisible, sans les charges sociales ni les contraintes d'un employé traditionnel."
  },
  {
    icon: Smile,
    title: "Service constant",
    description: "Une qualité de service qui ne fluctue jamais, garantissant une expérience client optimale en toutes circonstances."
  }
];

export default function Reliability() {
  return (
    <section className="py-24 bg-white">
      <div className="container mx-auto px-4">
        <div className="flex flex-col lg:flex-row items-center gap-12">
          <div className="flex-1 space-y-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="space-y-6"
            >
              <h2 className="text-3xl lg:text-4xl font-bold">
                Un Secrétariat <span className="gradient-text">Ultra-Professionnel</span>
              </h2>
              <p className="text-lg text-gray-600">
                Découvrez une solution de secrétariat qui surpasse les limitations humaines,
                offrant une constance et une fiabilité inégalées pour votre cabinet.
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {benefits.map((benefit, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="p-6 bg-gradient-to-br from-gray-50 to-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300"
                >
                  <benefit.icon className="w-8 h-8 text-blue-600 mb-4" />
                  <h3 className="text-xl font-semibold mb-2">{benefit.title}</h3>
                  <p className="text-gray-600">{benefit.description}</p>
                </motion.div>
              ))}
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="flex-1 relative"
          >
            <div className="w-full h-[500px] bg-gradient-to-br from-blue-500 to-purple-500 rounded-3xl blob-animation 
                          flex items-center justify-center p-4 md:p-8">
              <img 
                src="https://cdn.shopify.com/s/files/1/2410/5035/files/ChatGPT_Image_15_mai_2025_20_34_34.png?v=1747334120"
                alt="Assistant virtuel professionnel"
                className="w-full h-full object-cover rounded-2xl shadow-2xl"
              />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}