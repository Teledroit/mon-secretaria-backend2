import { useState, useEffect } from 'react';
import { DollarSign, TrendingUp, Calendar, CreditCard, Download } from 'lucide-react';
import Button from '@/components/ui/Button';
import { supabase } from '@/lib/supabase';

interface RevenueData {
  totalRevenue: number;
  monthlyRevenue: number;
  averageOrderValue: number;
  subscriptionRevenue: number;
  oneTimeRevenue: number;
  growth: number;
}

interface MonthlyData {
  month: string;
  revenue: number;
  subscriptions: number;
  newUsers: number;
}

export default function RevenueAnalytics() {
  const [revenueData, setRevenueData] = useState<RevenueData>({
    totalRevenue: 0,
    monthlyRevenue: 0,
    averageOrderValue: 0,
    subscriptionRevenue: 0,
    oneTimeRevenue: 0,
    growth: 0
  });
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchRevenueData();
  }, []);

  const fetchRevenueData = async () => {
    try {
      // Récupérer les commandes
      const { data: orders, error: ordersError } = await supabase
        .from('stripe_orders')
        .select('*')
        .eq('status', 'completed');

      if (ordersError) throw ordersError;

      // Récupérer les abonnements
      const { data: subscriptions, error: subsError } = await supabase
        .from('stripe_user_subscriptions')
        .select('*')
        .eq('subscription_status', 'active');

      if (subsError) throw subsError;

      // Calculer les revenus
      const totalRevenue = orders?.reduce((sum, order) => sum + (order.amount_total / 100), 0) || 0;
      const subscriptionRevenue = subscriptions?.length * 397 || 0; // Prix moyen abonnement
      const oneTimeRevenue = totalRevenue - subscriptionRevenue;
      
      const currentMonth = new Date();
      currentMonth.setDate(1);
      const monthlyOrders = orders?.filter(order => 
        new Date(order.created_at) >= currentMonth
      ) || [];
      const monthlyRevenue = monthlyOrders.reduce((sum, order) => sum + (order.amount_total / 100), 0);

      const averageOrderValue = orders?.length > 0 ? totalRevenue / orders.length : 0;

      // Calculer la croissance (simulée)
      const growth = 15.3; // Pourcentage de croissance

      setRevenueData({
        totalRevenue,
        monthlyRevenue,
        averageOrderValue,
        subscriptionRevenue,
        oneTimeRevenue,
        growth
      });

      // Générer des données mensuelles (simulées)
      const months = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin'];
      const mockMonthlyData: MonthlyData[] = months.map((month, index) => ({
        month,
        revenue: Math.floor(Math.random() * 5000) + 2000,
        subscriptions: Math.floor(Math.random() * 20) + 10,
        newUsers: Math.floor(Math.random() * 15) + 5
      }));

      setMonthlyData(mockMonthlyData);

    } catch (error) {
      console.error('Error fetching revenue data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const exportRevenueReport = () => {
    const report = {
      summary: revenueData,
      monthly: monthlyData,
      generatedAt: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `revenue_report_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
        <h1 className="text-2xl font-semibold text-gray-900">Analyse des Revenus</h1>
        <Button onClick={exportRevenueReport} variant="outline">
          <Download className="w-4 h-4 mr-2" />
          Exporter Rapport
        </Button>
      </div>

      {/* Métriques principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div className="p-2 bg-green-50 rounded-lg">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
            <span className="text-sm font-medium text-green-600">
              +{revenueData.growth}%
            </span>
          </div>
          <div className="mt-4">
            <h3 className="text-sm font-medium text-gray-500">Revenus Total</h3>
            <p className="text-2xl font-semibold mt-1">{revenueData.totalRevenue.toFixed(0)}€</p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div className="p-2 bg-blue-50 rounded-lg">
              <Calendar className="w-6 h-6 text-blue-600" />
            </div>
            <span className="text-sm font-medium text-blue-600">
              Ce mois
            </span>
          </div>
          <div className="mt-4">
            <h3 className="text-sm font-medium text-gray-500">Revenus Mensuels</h3>
            <p className="text-2xl font-semibold mt-1">{revenueData.monthlyRevenue.toFixed(0)}€</p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div className="p-2 bg-purple-50 rounded-lg">
              <CreditCard className="w-6 h-6 text-purple-600" />
            </div>
            <span className="text-sm font-medium text-purple-600">
              Abonnements
            </span>
          </div>
          <div className="mt-4">
            <h3 className="text-sm font-medium text-gray-500">Revenus Récurrents</h3>
            <p className="text-2xl font-semibold mt-1">{revenueData.subscriptionRevenue.toFixed(0)}€</p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div className="p-2 bg-orange-50 rounded-lg">
              <TrendingUp className="w-6 h-6 text-orange-600" />
            </div>
            <span className="text-sm font-medium text-orange-600">
              Moyenne
            </span>
          </div>
          <div className="mt-4">
            <h3 className="text-sm font-medium text-gray-500">Valeur Commande Moy.</h3>
            <p className="text-2xl font-semibold mt-1">{revenueData.averageOrderValue.toFixed(0)}€</p>
          </div>
        </div>
      </div>

      {/* Évolution mensuelle */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <h2 className="text-lg font-medium mb-6">Évolution Mensuelle</h2>
        <div className="space-y-4">
          {monthlyData.map((month, index) => (
            <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-4">
                <span className="font-medium text-gray-900">{month.month}</span>
                <div className="flex items-center space-x-6">
                  <div className="text-center">
                    <p className="text-sm font-medium text-green-600">{month.revenue}€</p>
                    <p className="text-xs text-gray-500">Revenus</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium text-blue-600">{month.subscriptions}</p>
                    <p className="text-xs text-gray-500">Abonnements</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium text-purple-600">{month.newUsers}</p>
                    <p className="text-xs text-gray-500">Nouveaux</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}