import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Phone, Menu, X } from 'lucide-react';
import Button from '../ui/Button';

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const scrollToDemo = () => {
    const demoSection = document.getElementById('demo-section');
    if (demoSection) {
      demoSection.scrollIntoView({ behavior: 'smooth' });
    }
    setIsMenuOpen(false);
  };

  const scrollToFAQ = () => {
    const faqSection = document.getElementById('faq');
    if (faqSection) {
      faqSection.scrollIntoView({ behavior: 'smooth' });
    }
    setIsMenuOpen(false);
  };

  return (
    <header className="border-b bg-white sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center space-x-2">
            <img src="https://cdn.shopify.com/s/files/1/2410/5035/files/LOGO_monsecretaria.png?v=1747322719" alt="MonSecretarIA" className="w-8 h-8" />
            <span className="text-xl font-semibold">MonSecretarIA</span>
          </Link>
          
          <nav className="hidden md:flex items-center space-x-6">
            <a href="#features" className="text-gray-600 hover:text-gray-900">Fonctionnalités</a>
            <button onClick={scrollToFAQ} className="text-gray-600 hover:text-gray-900">FAQ</button>
            <a href="#pricing" className="text-gray-600 hover:text-gray-900">Tarifs</a>
            <a href="#contact" className="text-gray-600 hover:text-gray-900">Contact</a>
            <Link to="/login">
              <Button variant="outline">Connexion</Button>
            </Link>
            <Button onClick={scrollToDemo}>Voir la démo</Button>
          </nav>

          <button 
            className="md:hidden p-2"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
        </div>

        {isMenuOpen && (
          <div className="md:hidden mt-4 pb-4">
            <nav className="flex flex-col space-y-4">
              <a 
                href="#features" 
                className="text-gray-600 hover:text-gray-900 py-2"
                onClick={() => setIsMenuOpen(false)}
              >
                Fonctionnalités
              </a>
              <button 
                onClick={() => {
                  scrollToFAQ();
                  setIsMenuOpen(false);
                }}
                className="text-gray-600 hover:text-gray-900 py-2 text-left"
              >
                FAQ
              </button>
              <a 
                href="#pricing" 
                className="text-gray-600 hover:text-gray-900 py-2"
                onClick={() => setIsMenuOpen(false)}
              >
                Tarifs
              </a>
              <a 
                href="#contact" 
                className="text-gray-600 hover:text-gray-900 py-2"
                onClick={() => setIsMenuOpen(false)}
              >
                Contact
              </a>
              <Link 
                to="/login"
                onClick={() => setIsMenuOpen(false)}
              >
                <Button variant="outline" className="w-full">Connexion</Button>
              </Link>
              <Button 
                className="w-full" 
                onClick={() => {
                  scrollToDemo();
                  setIsMenuOpen(false);
                }}
              >
                Voir la démo
              </Button>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}