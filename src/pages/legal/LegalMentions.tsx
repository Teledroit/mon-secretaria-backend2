import { useEffect } from 'react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

export default function LegalMentions() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 bg-gray-50 py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-lg p-8">
            <h1 className="text-3xl font-bold text-center mb-8">
              Mentions Légales
            </h1>

            <div className="prose prose-gray max-w-none">
              <p className="text-gray-600 mb-6">
                MonSecretarIA est un site détenu par Flamant Mode, micro-entreprise, immatriculée au Registre du Commerce et des Sociétés de Créteil et dirigé par M. Fitoussi Emmanuel.
              </p>

              <p className="text-gray-600 mb-6">
                Numéro SIRET : 839 214 863 00012
              </p>

              <p className="text-gray-600 mb-6">
                Contact : <a href="mailto:contact.monsecretaria@gmail.com" className="text-blue-600 hover:text-blue-800">contact.monsecretaria@gmail.com</a>
              </p>

              <p className="text-gray-600 mb-6">
                Flamant Mode – 178 rue du marechal leclerc, 94410 St Maurice, France
              </p>

              <p className="text-gray-600">
                Hébergeur : Netlify Inc., located at 512 2nd Street, Suite 200 San Francisco, CA 94107, USA
              </p>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}