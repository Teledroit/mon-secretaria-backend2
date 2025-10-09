import { motion } from 'framer-motion';
import { Shield, Scale, Briefcase, AlertCircle, User, CreditCard } from 'lucide-react';

export default function LogoSection() {
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
                Une Solution <span className="gradient-text">Innovante</span> pour les Cabinets d'Avocats, créée par @TELEDROIT
              </h2>
              <p className="text-lg text-gray-600">
                MonSecretarIA révolutionne l'accueil téléphonique des cabinets d'avocats avec une technologie d'intelligence artificielle de pointe.
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
                className="p-4 bg-gray-50 rounded-lg"
              >
                <AlertCircle className="w-8 h-8 text-blue-600 mb-3" />
                <h3 className="font-semibold mb-2">Transfert sur Urgence</h3>
                <p className="text-sm text-gray-600">Détection automatique des situations urgentes nécessitant une intervention immédiate.</p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3 }}
                className="p-4 bg-gray-50 rounded-lg"
              >
                <User className="w-8 h-8 text-blue-600 mb-3" />
                <h3 className="font-semibold mb-2">Clients Existants</h3>
                <p className="text-sm text-gray-600">Reconnaissance et transfert prioritaire pour vos clients actuels.</p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.4 }}
                className="p-4 bg-gray-50 rounded-lg"
              >
                <CreditCard className="w-8 h-8 text-blue-600 mb-3" />
                <h3 className="font-semibold mb-2">Seuil de Montant</h3>
                <p className="text-sm text-gray-600">Transfert automatique pour les dossiers dépassant un montant défini.</p>
              </motion.div>
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="flex-1 flex justify-center items-center"
          >
            <img
              src="https://cdn.shopify.com/s/files/1/2410/5035/files/LOGO_monsecretaria.png?v=1747322719"
              alt="MonSecretarIA Logo"
              width="512"
              height="341"
              className="w-full max-w-[512px] h-auto object-contain"
            />
          </motion.div>
        </div>
      </div>
    </section>
  );
}