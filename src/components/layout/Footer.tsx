import { useState } from 'react';
import { Phone, Mail, MapPin, Linkedin, Instagram, Youtube, GitBranch as BrandTiktok, FileText } from 'lucide-react';
import { Link } from 'react-router-dom';
import Button from '../ui/Button';

export default function Footer() {
  const [email, setEmail] = useState('');
  const [subscribeStatus, setSubscribeStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  
  const currentYear = new Date().getFullYear();

  const scrollToFeatures = () => {
    const featuresSection = document.getElementById('features');
    if (featuresSection) {
      featuresSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubscribeStatus('loading');
    setErrorMessage('');

    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

    console.log('Starting newsletter subscription with:', {
      supabaseUrl,
      email,
      hasKey: !!supabaseKey
    });

    try {
      const response = await fetch(`${supabaseUrl}/functions/v1/newsletter-subscribe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseKey}`,
        },
        body: JSON.stringify({ email }),
      });

      console.log('Newsletter subscription response:', {
        status: response.status,
        ok: response.ok,
        statusText: response.statusText
      });

      let data;
      try {
        data = await response.json();
        console.log('Response data:', data);
      } catch (jsonError) {
        console.error('Error parsing JSON response:', jsonError);
        throw new Error('Invalid response format');
      }

      if (!response.ok) {
        throw new Error(data.error || 'Une erreur est survenue');
      }

      setSubscribeStatus('success');
      setEmail('');
      setTimeout(() => setSubscribeStatus('idle'), 3000);
    } catch (error: any) {
      console.error('Newsletter subscription error:', {
        error,
        message: error.message,
        stack: error.stack
      });
      setErrorMessage(error.message || 'Une erreur est survenue lors de l\'inscription');
      setSubscribeStatus('error');
    }
  };

  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          {/* À propos */}
          <div>
            <div className="flex items-center space-x-2 mb-6">
              <Phone className="w-6 h-6 text-blue-400" />
              <span className="text-xl font-semibold text-white">MonSecretarIA</span>
            </div>
            <p className="text-gray-400 mb-6">
              Solution innovante de standardiste virtuelle pour les cabinets d'avocats,
              disponible 24/7 pour une gestion optimale de vos appels.
            </p>
            <div className="flex space-x-4">
              <a href="https://www.linkedin.com/company/teledroit" target="_blank" rel="noopener noreferrer" className="hover:text-blue-400 transition-colors">
                <Linkedin className="w-5 h-5" />
              </a>
              <a href="https://www.instagram.com/teledroit" target="_blank" rel="noopener noreferrer" className="hover:text-blue-400 transition-colors">
                <Instagram className="w-5 h-5" />
              </a>
              <a href="https://www.youtube.com/@teledroit" target="_blank" rel="noopener noreferrer" className="hover:text-blue-400 transition-colors">
                <Youtube className="w-5 h-5" />
              </a>
              <a href="https://www.tiktok.com/@teledroit" target="_blank" rel="noopener noreferrer" className="hover:text-blue-400 transition-colors">
                <BrandTiktok className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Liens rapides */}
          <div>
            <h3 className="text-white font-semibold text-lg mb-6">Liens Rapides</h3>
            <ul className="space-y-4">
              <li>
                <a onClick={scrollToFeatures} className="hover:text-blue-400 transition-colors cursor-pointer">
                  Fonctionnalités
                </a>
              </li>
              <li>
                <Link to="/conditions-generales" className="hover:text-blue-400 transition-colors">
                  Conditions générales
                </Link>
              </li>
              <li>
                <Link to="/politique-de-confidentialite" className="hover:text-blue-400 transition-colors">
                  Politique de confidentialité
                </Link>
              </li>
              <li>
                <Link to="/blog" className="hover:text-blue-400 transition-colors">
                  Blog
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-white font-semibold text-lg mb-6">Contact</h3>
            <ul className="space-y-4">
              <li className="flex items-center space-x-3">
                <MapPin className="w-5 h-5 text-blue-400" />
                <span>Un service crée par @TELEDROIT</span>
              </li>
              <li className="flex items-center space-x-3">
                <Mail className="w-5 h-5 text-blue-400" />
                <span>contact.monsecretaria@gmail.com</span>
              </li>
              <li className="flex items-center space-x-3">
                <Phone className="w-5 h-5 text-blue-400" />
                <span>+33 7 66 74 07 68</span>
              </li>
              <li className="flex items-center space-x-3">
                <FileText className="w-5 h-5 text-blue-400" />
                <Link to="/subscription/cancel" className="hover:text-blue-400 transition-colors">
                  Formulaire de fin d'abonnement
                </Link>
              </li>
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h3 className="text-white font-semibold text-lg mb-6">Newsletter</h3>
            <p className="text-gray-400 mb-4">
              Restez informé de nos dernières actualités et mises à jour.
            </p>
            <form onSubmit={handleSubscribe} className="space-y-4">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Votre email"
                className="w-full px-4 py-2 rounded-lg bg-gray-800 border border-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
              <Button
                type="submit"
                disabled={subscribeStatus === 'loading'}
                className="w-full"
              >
                {subscribeStatus === 'loading' ? 'Inscription...' : 'S\'abonner'}
              </Button>
              
              {subscribeStatus === 'success' && (
                <p className="text-green-400 text-sm">
                  Inscription réussie !
                </p>
              )}
              
              {subscribeStatus === 'error' && (
                <p className="text-red-400 text-sm">
                  {errorMessage || 'Une erreur est survenue. Veuillez réessayer.'}
                </p>
              )}
            </form>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-12 pt-8 text-center">
          <p className="text-gray-400">
            © {currentYear} MonSecretarIA. Tous droits réservés. 
            <Link to="/mentions-legales" className="ml-2 hover:text-blue-400 transition-colors">
              Mentions légales
            </Link>
          </p>
        </div>
      </div>
    </footer>
  );
}