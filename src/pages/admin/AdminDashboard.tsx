import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, 
  Phone, 
  DollarSign, 
  TrendingUp, 
  AlertCircle, 
  Settings,
  Database,
  Activity,
  Mail,
  Shield,
  LogOut,
  Download,
  RefreshCw,
  Code,
  TestTube,
  Server,
  Globe,
  CreditCard,
  Calendar,
  MessageSquare
} from 'lucide-react';
import Button from '@/components/ui/Button';
import { supabase } from '@/lib/supabase';
import QualityDashboard from '@/components/admin/QualityDashboard';
import MaintenanceDashboard from '@/components/admin/MaintenanceDashboard';

interface AdminStats {
  totalUsers: number;
  activeSubscriptions: number;
  totalRevenue: number;
  totalCalls: number;
  systemHealth: 'healthy' | 'warning' | 'critical';
  monthlyGrowth: number;
  averageRevenuePerUser: number;
}

interface RecentUser {
  id: string;
  email: string;
  full_name: string;
  company_name: string;
  created_at: string;
  subscription_status?: string;
  last_call?: string;
}

interface SystemMetric {
  name: string;
  value: string;
  status: 'healthy' | 'warning' | 'critical';
  description: string;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0,
    activeSubscriptions: 0,
    totalRevenue: 0,
    totalCalls: 0,
    systemHealth: 'healthy',
    monthlyGrowth: 0,
    averageRevenuePerUser: 0
  });
  const [recentUsers, setRecentUsers] = useState<RecentUser[]>([]);
  const [systemMetrics, setSystemMetrics] = useState<SystemMetric[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'system' | 'revenue' | 'quality' | 'maintenance'>('overview');
  const navigate = useNavigate();

  useEffect(() => {
    // Vérifier l'accès admin
    const adminSession = localStorage.getItem('admin_session');
    if (!adminSession) {
      navigate('/admin/login');
      return;
    }

    fetchAdminData();
    fetchSystemMetrics();
    
    // Actualiser les données toutes les 30 secondes
    const interval = setInterval(() => {
      fetchAdminData();
      fetchSystemMetrics();
    }, 30000);
    
    return () => clearInterval(interval);
  }, [navigate]);

  const fetchAdminData = async () => {
    try {
      setError(null);

      // Récupérer les statistiques utilisateurs
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select(`
          *,
          stripe_customers (
            customer_id
          )
        `)
        .order('created_at', { ascending: false });

      if (usersError) throw usersError;

      // Récupérer les abonnements actifs
      const { data: subscriptions, error: subsError } = await supabase
        .from('stripe_user_subscriptions')
        .select('*')
        .in('subscription_status', ['active', 'trialing']);

      if (subsError) throw subsError;

      // Récupérer le total des appels
      const { data: calls, error: callsError } = await supabase
        .from('calls')
        .select('*')
        .order('start_time', { ascending: false });

      if (callsError) throw callsError;

      // Récupérer les commandes pour le chiffre d'affaires
      const { data: orders, error: ordersError } = await supabase
        .from('stripe_orders')
        .select('amount_total, created_at')
        .eq('status', 'completed');

      if (ordersError) throw ordersError;

      const totalRevenue = orders?.reduce((sum, order) => sum + (order.amount_total / 100), 0) || 0;
      const averageRevenuePerUser = users?.length > 0 ? totalRevenue / users.length : 0;

      // Calculer la croissance mensuelle
      const lastMonth = new Date();
      lastMonth.setMonth(lastMonth.getMonth() - 1);
      const usersLastMonth = users?.filter(u => new Date(u.created_at) >= lastMonth).length || 0;
      const monthlyGrowth = users?.length > 0 ? (usersLastMonth / users.length) * 100 : 0;

      setStats({
        totalUsers: users?.length || 0,
        activeSubscriptions: subscriptions?.length || 0,
        totalRevenue,
        totalCalls: calls?.length || 0,
        systemHealth: 'healthy',
        monthlyGrowth,
        averageRevenuePerUser
      });

      // Formater les utilisateurs récents avec leurs derniers appels
      const formattedUsers: RecentUser[] = users?.slice(0, 10).map(user => {
        const userCalls = calls?.filter(call => call.user_id === user.id);
        const lastCall = userCalls?.[0]?.start_time;
        
        return {
          id: user.id,
          email: user.email,
          full_name: user.full_name || 'Non renseigné',
          company_name: user.company_name || 'Non renseigné',
          created_at: user.created_at,
          last_call: lastCall,
          subscription_status: subscriptions?.find(s => 
            s.customer_id === user.stripe_customers?.[0]?.customer_id
          )?.subscription_status
        };
      }) || [];

      setRecentUsers(formattedUsers);

    } catch (error) {
      console.error('Error fetching admin data:', error);
      setError('Erreur lors du chargement des données administrateur');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSystemMetrics = async () => {
    try {
      // Simuler des métriques système (en production, ces données viendraient de votre monitoring)
      const metrics: SystemMetric[] = [
        {
          name: 'API Supabase',
          value: '99.9%',
          status: 'healthy',
          description: 'Disponibilité base de données'
        },
        {
          name: 'Backend Render',
          value: '98.5%',
          status: 'healthy',
          description: 'Service backend opérationnel'
        },
        {
          name: 'Twilio Voice',
          value: '99.2%',
          status: 'healthy',
          description: 'Service téléphonique'
        },
        {
          name: 'ElevenLabs TTS',
          value: '97.8%',
          status: 'warning',
          description: 'Synthèse vocale'
        },
        {
          name: 'OpenAI API',
          value: '99.1%',
          status: 'healthy',
          description: 'Intelligence artificielle'
        },
        {
          name: 'Stripe Payments',
          value: '100%',
          status: 'healthy',
          description: 'Système de paiement'
        }
      ];

      setSystemMetrics(metrics);
    } catch (error) {
      console.error('Error fetching system metrics:', error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('admin_session');
    supabase.auth.signOut();
    navigate('/admin/login');
  };

  const exportData = async (type: 'users' | 'calls' | 'revenue') => {
    try {
      let data;
      let filename;

      switch (type) {
        case 'users':
          const { data: userData } = await supabase
            .from('users')
            .select('*')
            .order('created_at', { ascending: false });
          data = userData;
          filename = 'users_export.json';
          break;

        case 'calls':
          const { data: callData } = await supabase
            .from('calls')
            .select('*')
            .order('start_time', { ascending: false })
            .limit(1000);
          data = callData;
          filename = 'calls_export.json';
          break;

        case 'revenue':
          const { data: revenueData } = await supabase
            .from('stripe_orders')
            .select('*')
            .order('created_at', { ascending: false });
          data = revenueData;
          filename = 'revenue_export.json';
          break;
      }

      if (data) {
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Error exporting data:', error);
      alert('Erreur lors de l\'export des données');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-600 bg-green-50 border-green-200';
      case 'warning': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'critical': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Admin */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <Shield className="w-8 h-8 text-blue-600" />
              <div>
                <h1 className="text-xl font-bold text-gray-900">Administration MonSecretarIA</h1>
                <p className="text-sm text-gray-600">Tableau de bord propriétaire</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Button
                onClick={fetchAdminData}
                variant="outline"
                size="sm"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Actualiser
              </Button>
              <Button
                onClick={handleLogout}
                variant="outline"
                size="sm"
                className="text-red-600 hover:text-red-700 border-red-200 hover:border-red-300"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Déconnexion
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center">
              <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
              <p className="text-red-700">{error}</p>
            </div>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="mb-8">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              {[
                { id: 'overview', label: 'Vue d\'ensemble', icon: Activity },
                { id: 'users', label: 'Utilisateurs', icon: Users },
                { id: 'system', label: 'Système', icon: Server },
                { id: 'revenue', label: 'Revenus', icon: DollarSign },
                { id: 'quality', label: 'Qualité', icon: Code },
                { id: 'maintenance', label: 'Maintenance', icon: Settings }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`py-4 px-6 text-center border-b-2 font-medium text-sm flex items-center space-x-2 ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Vue d'ensemble */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Statistiques principales */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                <div className="flex items-center justify-between">
                  <div className="p-2 bg-blue-50 rounded-lg">
                    <Users className="w-6 h-6 text-blue-600" />
                  </div>
                  <span className="text-sm font-medium text-green-600">
                    +{stats.monthlyGrowth.toFixed(1)}%
                  </span>
                </div>
                <div className="mt-4">
                  <h3 className="text-sm font-medium text-gray-500">Utilisateurs Total</h3>
                  <p className="text-2xl font-semibold mt-1">{stats.totalUsers}</p>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                <div className="flex items-center justify-between">
                  <div className="p-2 bg-green-50 rounded-lg">
                    <CreditCard className="w-6 h-6 text-green-600" />
                  </div>
                  <span className="text-sm font-medium text-blue-600">
                    {stats.activeSubscriptions} actifs
                  </span>
                </div>
                <div className="mt-4">
                  <h3 className="text-sm font-medium text-gray-500">Abonnements</h3>
                  <p className="text-2xl font-semibold mt-1">{stats.activeSubscriptions}</p>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                <div className="flex items-center justify-between">
                  <div className="p-2 bg-purple-50 rounded-lg">
                    <DollarSign className="w-6 h-6 text-purple-600" />
                  </div>
                  <span className="text-sm font-medium text-green-600">
                    {stats.averageRevenuePerUser.toFixed(0)}€/user
                  </span>
                </div>
                <div className="mt-4">
                  <h3 className="text-sm font-medium text-gray-500">Chiffre d'Affaires</h3>
                  <p className="text-2xl font-semibold mt-1">{stats.totalRevenue.toFixed(0)}€</p>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                <div className="flex items-center justify-between">
                  <div className="p-2 bg-orange-50 rounded-lg">
                    <Phone className="w-6 h-6 text-orange-600" />
                  </div>
                  <span className="text-sm font-medium text-blue-600">
                    {(stats.totalCalls / Math.max(stats.totalUsers, 1)).toFixed(1)}/user
                  </span>
                </div>
                <div className="mt-4">
                  <h3 className="text-sm font-medium text-gray-500">Appels Total</h3>
                  <p className="text-2xl font-semibold mt-1">{stats.totalCalls}</p>
                </div>
              </div>
            </div>

            {/* État du système */}
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <h2 className="text-lg font-medium mb-4 flex items-center">
                <Activity className="w-5 h-5 text-blue-600 mr-2" />
                État du Système
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {systemMetrics.map((metric, index) => (
                  <div key={index} className={`p-4 rounded-lg border ${getStatusColor(metric.status)}`}>
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium">{metric.name}</h3>
                      <span className="text-lg font-bold">{metric.value}</span>
                    </div>
                    <p className="text-sm opacity-75">{metric.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Onglet Utilisateurs */}
        {activeTab === 'users' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-medium">Gestion des Utilisateurs</h2>
              <Button
                onClick={() => exportData('users')}
                variant="outline"
              >
                <Download className="w-4 h-4 mr-2" />
                Exporter
              </Button>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Utilisateur
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Cabinet
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Inscription
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Abonnement
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Dernier Appel
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {recentUsers.map((user) => (
                      <tr key={user.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{user.full_name}</div>
                            <div className="text-sm text-gray-500">{user.email}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {user.company_name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(user.created_at).toLocaleDateString('fr-FR')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            user.subscription_status === 'active' 
                              ? 'bg-green-100 text-green-800'
                              : user.subscription_status === 'trialing'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {user.subscription_status || 'Aucun'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {user.last_call 
                            ? new Date(user.last_call).toLocaleDateString('fr-FR')
                            : 'Jamais'
                          }
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Onglet Système */}
        {activeTab === 'system' && (
          <div className="space-y-6">
            <h2 className="text-lg font-medium">Monitoring Système</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {systemMetrics.map((metric, index) => (
                <div key={index} className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-medium text-gray-900">{metric.name}</h3>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(metric.status)}`}>
                      {metric.status === 'healthy' ? 'Opérationnel' :
                       metric.status === 'warning' ? 'Attention' : 'Critique'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-2xl font-bold text-gray-900">{metric.value}</p>
                    <div className={`w-3 h-3 rounded-full ${
                      metric.status === 'healthy' ? 'bg-green-500' :
                      metric.status === 'warning' ? 'bg-yellow-500' : 'bg-red-500'
                    }`} />
                  </div>
                  <p className="text-sm text-gray-600 mt-2">{metric.description}</p>
                </div>
              ))}
            </div>

            {/* Actions système */}
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <h3 className="text-lg font-medium mb-4">Actions Système</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button
                  onClick={() => exportData('calls')}
                  variant="outline"
                  className="flex items-center justify-center"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Exporter Appels
                </Button>
                <Button
                  onClick={() => exportData('revenue')}
                  variant="outline"
                  className="flex items-center justify-center"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Exporter Revenus
                </Button>
                <Button
                  onClick={() => window.open('https://dashboard.stripe.com', '_blank')}
                  variant="outline"
                  className="flex items-center justify-center"
                >
                  <Globe className="w-4 h-4 mr-2" />
                  Dashboard Stripe
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Onglet Revenus */}
        {activeTab === 'revenue' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-medium">Analyse des Revenus</h2>
              <Button
                onClick={() => exportData('revenue')}
                variant="outline"
              >
                <Download className="w-4 h-4 mr-2" />
                Exporter
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                <h3 className="font-medium text-gray-900 mb-2">Revenus Mensuels</h3>
                <p className="text-3xl font-bold text-green-600">{stats.totalRevenue.toFixed(0)}€</p>
                <p className="text-sm text-gray-600 mt-1">Ce mois</p>
              </div>

              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                <h3 className="font-medium text-gray-900 mb-2">Revenu par Utilisateur</h3>
                <p className="text-3xl font-bold text-blue-600">{stats.averageRevenuePerUser.toFixed(0)}€</p>
                <p className="text-sm text-gray-600 mt-1">Moyenne</p>
              </div>

              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                <h3 className="font-medium text-gray-900 mb-2">Croissance</h3>
                <p className="text-3xl font-bold text-purple-600">+{stats.monthlyGrowth.toFixed(1)}%</p>
                <p className="text-sm text-gray-600 mt-1">Ce mois</p>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <h3 className="text-lg font-medium mb-4">Répartition des Abonnements</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                  <span className="font-medium">Plan Starter (1€/mois)</span>
                  <span className="text-blue-600 font-medium">
                    {recentUsers.filter(u => u.subscription_status === 'active').length} utilisateurs
                  </span>
                </div>
                <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                  <span className="font-medium">Plan Premium (397€/mois)</span>
                  <span className="text-green-600 font-medium">
                    {recentUsers.filter(u => u.subscription_status === 'trialing').length} utilisateurs
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Onglet Qualité */}
        {activeTab === 'quality' && <QualityDashboard />}

        {/* Onglet Maintenance */}
        {activeTab === 'maintenance' && <MaintenanceDashboard />}
      </main>
    </div>
  );
}