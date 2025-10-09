import { Download, FileText } from 'lucide-react';
import { useEffect } from 'react';
import Button from '@/components/ui/Button';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

export default function CancellationForm() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 bg-gray-50 py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-lg p-8">
            <h1 className="text-3xl font-bold text-center mb-8">
              Formulaire de fin d'abonnement
            </h1>

            <div className="prose prose-gray mx-auto">
              <p className="text-gray-600 mb-6">
                Pour mettre fin à votre abonnement, veuillez télécharger le formulaire ci-dessous, 
                le remplir et nous le retourner. Votre demande sera traitée dans les plus brefs délais.
              </p>

              <div className="bg-gray-50 p-6 rounded-lg mb-8">
                <h2 className="text-xl font-semibold mb-4">Instructions :</h2>
                <ol className="list-decimal list-inside space-y-2 text-gray-600">
                  <li>Téléchargez le formulaire de résiliation</li>
                  <li>Remplissez tous les champs requis</li>
                  <li>Signez le document</li>
                  <li>Envoyez-le à : contact.monsecretaria@gmail.com</li>
                </ol>
              </div>

              <div className="text-center">
                <Button 
                  onClick={() => window.open('https://cdn.shopify.com/s/files/1/2410/5035/files/Formulaire_fin_abonnement.pdf?v=1747994821')}
                  size="lg"
                  className="inline-flex items-center"
                >
                  <Download className="w-5 h-5 mr-2" />
                  Télécharger le formulaire
                </Button>
              </div>

              <div className="mt-8 p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Note importante :</strong> La résiliation prendra effet à la fin du mois suivant 
                  la réception de votre demande complète. Vous continuerez à bénéficier du service 
                  jusqu'à la date effective de résiliation.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}