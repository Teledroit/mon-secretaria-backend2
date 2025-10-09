import { useState, useEffect } from 'react';
import { Activity, Server, Database, Globe, AlertTriangle, CheckCircle } from 'lucide-react';
import Button from '@/components/ui/Button';

interface SystemService {
  name: string;
  status: 'operational' | 'degraded' | 'down';
  uptime: string;
  responseTime: string;
  lastCheck: string;
  description: string;
}

export default function SystemMonitoring() {
  const [services, setServices] = useState<SystemService[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchSystemStatus();
    
    // Actualiser toutes les 30 secondes
    const interval = setInterval(fetchSystemStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchSystemStatus = async () => {
    try {
      // Simuler la vérification des services
      const mockServices: SystemService[] = [
        {
          name: 'Frontend (Netlify)',
          status: 'operational',
          uptime: '99.9%',
          responseTime: '120ms',
          lastCheck: new Date().toISOString(),
          description: 'Application web principale'
        },
        {
          name: 'Backend (Render)',
          status: 'operational',
          uptime: '98.5%',
          responseTime: '250ms',
          lastCheck: new Date().toISOString(),
          description: 'API et services backend'
        },
        {
          name: 'Base de données (Supabase)',
          status: 'operational',
          uptime: '99.8%',
          responseTime: '45ms',
          lastCheck: new Date().toISOString(),
          description: 'Stockage des données'
        },
        {
          name: 'Twilio Voice',
          status: 'operational',
          uptime: '99.2%',
          responseTime: '180ms',
          lastCheck: new Date().toISOString(),
          description: 'Service téléphonique'
        },
        {
          name: 'ElevenLabs TTS',
          status: 'degraded',
          uptime: '97.8%',
          responseTime: '850ms',
          lastCheck: new Date().toISOString(),
          description: 'Synthèse vocale'
        },
        {
          name: 'OpenAI API',
          status: 'operational',
          uptime: '99.1%',
          responseTime: '320ms',
          lastCheck: new Date().toISOString(),
          description: 'Intelligence artificielle'
        },
        {
          name: 'Stripe Payments',
          status: 'operational',
          uptime: '100%',
          responseTime: '95ms',
          lastCheck: new Date().toISOString(),
          description: 'Système de paiement'
        }
      ];

      setServices(mockServices);
    } catch (error) {
      console.error('Error fetching system status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'operational':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'degraded':
        return <AlertTriangle className="w-5 h-5 text-yellow-600" />;
      case 'down':
        return <AlertTriangle className="w-5 h-5 text-red-600" />;
      default:
        return <Activity className="w-5 h-5 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'operational':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'degraded':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'down':
        return 'text-red-600 bg-red-50 border-red-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-gray-900">Monitoring Système</h1>
        <Button onClick={fetchSystemStatus} variant="outline">
          <Activity className="w-4 h-4 mr-2" />
          Actualiser
        </Button>
      </div>

      {/* Vue d'ensemble du système */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <h2 className="text-lg font-medium mb-4">État Global du Système</h2>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span className="text-sm font-medium text-green-600">Tous les services opérationnels</span>
          </div>
          <div className="text-sm text-gray-600">
            Dernière vérification : {new Date().toLocaleTimeString('fr-FR')}
          </div>
        </div>
      </div>

      {/* Services */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {services.map((service, index) => (
          <div key={index} className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                {getStatusIcon(service.status)}
                <h3 className="font-medium text-gray-900">{service.name}</h3>
              </div>
              <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(service.status)}`}>
                {service.status === 'operational' ? 'Opérationnel' :
                 service.status === 'degraded' ? 'Dégradé' : 'Hors service'}
              </span>
            </div>
            
            <p className="text-sm text-gray-600 mb-4">{service.description}</p>
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-500">Disponibilité</p>
                <p className="font-medium">{service.uptime}</p>
              </div>
              <div>
                <p className="text-gray-500">Temps de réponse</p>
                <p className="font-medium">{service.responseTime}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Métriques détaillées */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <h2 className="text-lg font-medium mb-6">Métriques Détaillées</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <Server className="w-8 h-8 text-blue-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-blue-600">99.2%</p>
            <p className="text-sm text-blue-800">Uptime Global</p>
          </div>
          
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <Database className="w-8 h-8 text-green-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-green-600">245ms</p>
            <p className="text-sm text-green-800">Latence Moyenne</p>
          </div>
          
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <Globe className="w-8 h-8 text-purple-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-purple-600">1.2M</p>
            <p className="text-sm text-purple-800">Requêtes/jour</p>
          </div>
          
          <div className="text-center p-4 bg-orange-50 rounded-lg">
            <Activity className="w-8 h-8 text-orange-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-orange-600">0.01%</p>
            <p className="text-sm text-orange-800">Taux d'erreur</p>
          </div>
        </div>
      </div>

      {/* Liens rapides administration */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <h2 className="text-lg font-medium mb-4">Liens Rapides Administration</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Button
            onClick={() => window.open('https://dashboard.stripe.com', '_blank')}
            variant="outline"
            className="flex items-center justify-center"
          >
            <CreditCard className="w-4 h-4 mr-2" />
            Dashboard Stripe
          </Button>
          <Button
            onClick={() => window.open('https://supabase.com/dashboard', '_blank')}
            variant="outline"
            className="flex items-center justify-center"
          >
            <Database className="w-4 h-4 mr-2" />
            Console Supabase
          </Button>
          <Button
            onClick={() => window.open('https://console.twilio.com', '_blank')}
            variant="outline"
            className="flex items-center justify-center"
          >
            <Phone className="w-4 h-4 mr-2" />
            Console Twilio
          </Button>
        </div>
      </div>
    </div>
  );
}