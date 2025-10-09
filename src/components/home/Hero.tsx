import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Button from '@/components/ui/Button';
import { Phone, Calendar, MessageCircle } from 'lucide-react';

export default function Hero() {
  const scrollToPricing = () => {
    const pricingSection = document.getElementById('pricing');
    if (pricingSection) {
      pricingSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const scrollToDemo = () => {
    const demoSection = document.getElementById('demo-section');
    if (demoSection) {
      demoSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="hero-gradient">
      <div className="container mx-auto px-4 py-12 md:py-24">
        <div className="flex flex-col lg:flex-row items-center gap-12">
          <div className="flex-1 text-center lg:text-left">
            <h1 className="text-4xl lg:text-7xl font-bold mb-6">
              <span className="gradient-text">Standardiste IA</span>
              <br />
              <span className="text-gray-900">Nouvelle Génération</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl">
              Un assistant téléphonique intelligent qui révolutionne la gestion de vos appels. 
              Disponible 24/7, il s'adapte parfaitement aux besoins de votre cabinet d'avocats. Solution française, innovation TELEDROIT.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Button 
                size="lg" 
                className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                onClick={scrollToPricing}
              >
                Votre secretarIA
              </Button>
              <Button 
                variant="outline" 
                size="lg" 
                className="w-full sm:w-auto"
                onClick={scrollToDemo}
              >
                Voir la démo
              </Button>
            </div>
            <div className="mt-12 flex flex-row justify-center lg:justify-start space-x-4">
              {[
                { icon: Phone, label: '99.9% Disponibilité' },
                { icon: Calendar, label: 'Prise de RDV Intelligente' },
                { icon: MessageCircle, label: 'Support 24/7' }
              ].map((item, i) => (
                <div key={i} className="text-center flex-1 max-w-[150px]">
                  <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-2">
                    <item.icon className="w-6 h-6 text-blue-600" />
                  </div>
                  <p className="text-sm font-medium text-gray-600 line-clamp-2">{item.label}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="flex-1 relative w-full max-w-lg lg:max-w-none">
            <div className="w-full h-[300px] md:h-[500px] bg-gradient-to-br from-blue-500 to-purple-500 rounded-3xl blob-animation 
                          flex items-center justify-center p-4 md:p-8">
              <img 
                src="https://cdn.shopify.com/s/files/1/2410/5035/files/ChatGPT_Image_15_mai_2025_17_57_25.png?v=1747324659"
                alt="Équipe collaborative"
                className="rounded-2xl shadow-2xl w-full h-full object-cover"
              />
            </div>
            <div className="absolute -bottom-6 -right-6 bg-white p-4 md:p-6 rounded-xl shadow-lg max-w-xs">
              <div className="flex items-center gap-4 mb-3">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
                <p className="font-medium">Assistant en ligne</p>
              </div>
              <p className="text-sm text-gray-600">
                "Bonjour, je suis votre assistant virtuel. Comment puis-je vous aider aujourd'hui ?"
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}