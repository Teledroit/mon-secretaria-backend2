import { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, Clock, Users, Brain, Target } from 'lucide-react';
import { callAnalytics, CallAnalytics, CallInsights } from '@/lib/analytics/call-analytics';
import { useAuth } from '@/lib/AuthContext';
import CallVolumeChart from './charts/CallVolumeChart';
import SentimentChart from './charts/SentimentChart';
import PerformanceMetrics from './metrics/PerformanceMetrics';
import InsightsPanel from './insights/InsightsPanel';

export default function AnalyticsDashboard() {
  const [analytics, setAnalytics] = useState<CallAnalytics | null>(null);
  const [insights, setInsights] = useState<CallInsights | null>(null);
  const [period, setPeriod] = useState<'day' | 'week' | 'month'>('month');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchAnalytics();
    }
  }, [user, period]);

  const fetchAnalytics = async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      setError(null);

      const [analyticsData, insightsData] = await Promise.all([
        callAnalytics.getCallAnalytics(user.id, period),
        callAnalytics.getCallInsights(user.id)
      ]);

      setAnalytics(analyticsData);
      setInsights(insightsData);

    } catch (err) {
      console.error('Error fetching analytics:', err);
      setError('Erreur lors du chargement des analytics');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="h-64 bg-gray-200 rounded"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 mb-4">{error}</div>
        <button 
          onClick={fetchAnalytics}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Réessayer
        </button>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="text-center py-12 text-gray-500">
        Aucune donnée d'analytics disponible
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-gray-900">Analytics Avancées</h1>
        <div className="flex space-x-2">
          {(['day', 'week', 'month'] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-4 py-2 rounded-lg text-sm font-medium ${
                period === p
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {p === 'day' ? 'Jour' : p === 'week' ? 'Semaine' : 'Mois'}
            </button>
          ))}
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div className="p-2 bg-blue-50 rounded-lg">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <span className="text-sm font-medium text-green-600">
              +{Math.round(analytics.conversionRate)}%
            </span>
          </div>
          <div className="mt-4">
            <h3 className="text-sm font-medium text-gray-500">Total Appels</h3>
            <p className="text-2xl font-semibold mt-1">{analytics.totalCalls}</p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div className="p-2 bg-green-50 rounded-lg">
              <Clock className="w-6 h-6 text-green-600" />
            </div>
            <span className="text-sm font-medium text-blue-600">
              {Math.round(analytics.averageDuration)}min
            </span>
          </div>
          <div className="mt-4">
            <h3 className="text-sm font-medium text-gray-500">Durée Moyenne</h3>
            <p className="text-2xl font-semibold mt-1">
              {Math.floor(analytics.averageDuration)}:{String(Math.round((analytics.averageDuration % 1) * 60)).padStart(2, '0')}
            </p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div className="p-2 bg-purple-50 rounded-lg">
              <Target className="w-6 h-6 text-purple-600" />
            </div>
            <span className="text-sm font-medium text-green-600">
              +{Math.round(analytics.conversionRate)}%
            </span>
          </div>
          <div className="mt-4">
            <h3 className="text-sm font-medium text-gray-500">Taux de Conversion</h3>
            <p className="text-2xl font-semibold mt-1">{analytics.conversionRate.toFixed(1)}%</p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div className="p-2 bg-orange-50 rounded-lg">
              <Brain className="w-6 h-6 text-orange-600" />
            </div>
            <span className="text-sm font-medium text-blue-600">
              IA Active
            </span>
          </div>
          <div className="mt-4">
            <h3 className="text-sm font-medium text-gray-500">Sentiment Positif</h3>
            <p className="text-2xl font-semibold mt-1">
              {Math.round((analytics.sentimentDistribution.positive / 
                (analytics.sentimentDistribution.positive + analytics.sentimentDistribution.neutral + analytics.sentimentDistribution.negative) || 1) * 100)}%
            </p>
          </div>
        </div>
      </div>

      {/* Charts and Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CallVolumeChart data={analytics.peakHours} />
        <SentimentChart data={analytics.sentimentDistribution} />
      </div>

      {/* Performance Metrics */}
      <PerformanceMetrics analytics={analytics} />

      {/* Insights Panel */}
      {insights && <InsightsPanel insights={insights} />}

      {/* Keywords and Trends */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <h3 className="text-lg font-medium mb-4">Mots-clés Fréquents</h3>
          <div className="space-y-3">
            {analytics.topKeywords.map((keyword, index) => (
              <div key={index} className="flex justify-between items-center">
                <span className="text-gray-700">{keyword.keyword}</span>
                <div className="flex items-center space-x-2">
                  <div className="w-20 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full" 
                      style={{ width: `${(keyword.frequency / analytics.topKeywords[0]?.frequency || 1) * 100}%` }}
                    />
                  </div>
                  <span className="text-sm text-gray-500">{keyword.frequency}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <h3 className="text-lg font-medium mb-4">Tendances Mensuelles</h3>
          <div className="space-y-4">
            {analytics.monthlyTrends.map((trend, index) => (
              <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="font-medium">{trend.month}</span>
                <div className="text-right">
                  <p className="text-sm text-gray-600">{trend.calls} appels</p>
                  <p className="text-sm text-green-600">{trend.conversions} conversions</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}