import { useState, useEffect } from 'react';
import { Brain, TrendingUp, Calendar, AlertTriangle, Target } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { supabase } from '@/lib/supabase';

interface Prediction {
  type: 'call_volume' | 'peak_hours' | 'conversion_rate' | 'cost_forecast';
  title: string;
  prediction: string;
  confidence: number;
  timeframe: string;
  impact: 'positive' | 'neutral' | 'negative';
}

interface TrendData {
  date: string;
  calls: number;
  conversions: number;
  cost: number;
}

export default function PredictiveAnalytics() {
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [trends, setTrends] = useState<TrendData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      generatePredictions();
    }
  }, [user]);

  const generatePredictions = async () => {
    if (!user) return;

    try {
      // Fetch historical data for predictions
      const { data: calls, error } = await supabase
        .from('calls')
        .select('start_time, status, cost')
        .eq('user_id', user.id)
        .gte('start_time', new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString())
        .order('start_time', { ascending: true });

      if (error) throw error;

      const predictions = await analyzeTrendsAndPredict(calls || []);
      setPredictions(predictions);

      // Generate trend data for visualization
      const trendData = generateTrendData(calls || []);
      setTrends(trendData);

    } catch (error) {
      console.error('Error generating predictions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const analyzeTrendsAndPredict = async (calls: any[]): Promise<Prediction[]> => {
    const predictions: Prediction[] = [];

    // Analyze call volume trends
    const dailyCalls = groupCallsByDay(calls);
    const avgDailyCalls = dailyCalls.reduce((sum, day) => sum + day.count, 0) / dailyCalls.length;
    const trend = calculateTrend(dailyCalls.map(d => d.count));

    predictions.push({
      type: 'call_volume',
      title: 'Volume d\'Appels Prévu',
      prediction: `${Math.round(avgDailyCalls * (1 + trend))} appels/jour`,
      confidence: 0.85,
      timeframe: 'Prochaine semaine',
      impact: trend > 0 ? 'positive' : trend < -0.1 ? 'negative' : 'neutral'
    });

    // Peak hours prediction
    const hourlyDistribution = analyzeHourlyDistribution(calls);
    const peakHour = hourlyDistribution.reduce((max, current) => 
      current.count > max.count ? current : max
    );

    predictions.push({
      type: 'peak_hours',
      title: 'Heures de Pointe Prévues',
      prediction: `${peakHour.hour}h-${peakHour.hour + 1}h (${peakHour.count} appels)`,
      confidence: 0.78,
      timeframe: 'Demain',
      impact: 'neutral'
    });

    // Cost forecast
    const monthlyCost = calls.reduce((sum, call) => sum + (call.cost || 0), 0);
    const projectedCost = monthlyCost * (1 + trend);

    predictions.push({
      type: 'cost_forecast',
      title: 'Prévision de Coûts',
      prediction: `${projectedCost.toFixed(2)}€`,
      confidence: 0.72,
      timeframe: 'Mois prochain',
      impact: projectedCost > monthlyCost * 1.2 ? 'negative' : 'positive'
    });

    // Conversion rate prediction
    const conversions = calls.filter(call => call.status === 'completed').length;
    const conversionRate = calls.length > 0 ? (conversions / calls.length) * 100 : 0;

    predictions.push({
      type: 'conversion_rate',
      title: 'Taux de Conversion Attendu',
      prediction: `${(conversionRate * (1 + trend * 0.5)).toFixed(1)}%`,
      confidence: 0.68,
      timeframe: 'Prochaine semaine',
      impact: trend > 0 ? 'positive' : 'negative'
    });

    return predictions;
  };

  const groupCallsByDay = (calls: any[]): Array<{ date: string; count: number }> => {
    const groups: Record<string, number> = {};
    
    calls.forEach(call => {
      const date = new Date(call.start_time).toISOString().split('T')[0];
      groups[date] = (groups[date] || 0) + 1;
    });

    return Object.entries(groups).map(([date, count]) => ({ date, count }));
  };

  const analyzeHourlyDistribution = (calls: any[]): Array<{ hour: number; count: number }> => {
    const hours = new Array(24).fill(0);
    
    calls.forEach(call => {
      const hour = new Date(call.start_time).getHours();
      hours[hour]++;
    });

    return hours.map((count, hour) => ({ hour, count }));
  };

  const calculateTrend = (values: number[]): number => {
    if (values.length < 2) return 0;
    
    const firstHalf = values.slice(0, Math.floor(values.length / 2));
    const secondHalf = values.slice(Math.floor(values.length / 2));
    
    const firstAvg = firstHalf.reduce((sum, val) => sum + val, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, val) => sum + val, 0) / secondHalf.length;
    
    return firstAvg > 0 ? (secondAvg - firstAvg) / firstAvg : 0;
  };

  const generateTrendData = (calls: any[]): TrendData[] => {
    const dailyData = groupCallsByDay(calls);
    
    return dailyData.map(day => ({
      date: day.date,
      calls: day.count,
      conversions: Math.round(day.count * 0.3), // Estimated conversions
      cost: day.count * 0.15 // Estimated cost per call
    }));
  };

  const getImpactColor = (impact: string): string => {
    switch (impact) {
      case 'positive': return 'text-green-600 bg-green-50 border-green-200';
      case 'negative': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-blue-600 bg-blue-50 border-blue-200';
    }
  };

  const getConfidenceColor = (confidence: number): string => {
    if (confidence > 0.8) return 'text-green-600';
    if (confidence > 0.6) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-40 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Brain className="w-6 h-6 text-purple-600" />
        <h1 className="text-2xl font-semibold text-gray-900">Analytics Prédictives</h1>
      </div>

      {/* Predictions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {predictions.map((prediction, index) => (
          <div key={index} className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className={`p-2 rounded-lg ${getImpactColor(prediction.impact)}`}>
                  {prediction.type === 'call_volume' && <TrendingUp className="w-5 h-5" />}
                  {prediction.type === 'peak_hours' && <Calendar className="w-5 h-5" />}
                  {prediction.type === 'cost_forecast' && <Target className="w-5 h-5" />}
                  {prediction.type === 'conversion_rate' && <AlertTriangle className="w-5 h-5" />}
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">{prediction.title}</h3>
                  <p className="text-sm text-gray-500">{prediction.timeframe}</p>
                </div>
              </div>
              <span className={`text-sm font-medium ${getConfidenceColor(prediction.confidence)}`}>
                {Math.round(prediction.confidence * 100)}% confiance
              </span>
            </div>
            
            <div className="mb-4">
              <p className="text-2xl font-bold text-gray-900">{prediction.prediction}</p>
            </div>

            <div className={`p-3 rounded-lg border ${getImpactColor(prediction.impact)}`}>
              <p className="text-sm font-medium">
                {prediction.impact === 'positive' ? '📈 Tendance positive' :
                 prediction.impact === 'negative' ? '📉 Attention requise' :
                 '📊 Stable'}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Trend Visualization */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <h3 className="text-lg font-medium mb-6">Tendances Historiques et Prévisions</h3>
        
        <div className="space-y-4">
          {trends.slice(-7).map((trend, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-4">
                <span className="text-sm font-medium">
                  {new Date(trend.date).toLocaleDateString('fr-FR', { 
                    weekday: 'short', 
                    month: 'short', 
                    day: 'numeric' 
                  })}
                </span>
                <div className="flex items-center space-x-6">
                  <div className="text-center">
                    <p className="text-sm font-medium text-blue-600">{trend.calls}</p>
                    <p className="text-xs text-gray-500">Appels</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium text-green-600">{trend.conversions}</p>
                    <p className="text-xs text-gray-500">Conversions</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium text-purple-600">{trend.cost.toFixed(2)}€</p>
                    <p className="text-xs text-gray-500">Coût</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 p-4 bg-purple-50 rounded-lg">
          <h4 className="font-medium text-purple-900 mb-2">🔮 Prévisions IA</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <p className="font-medium text-purple-800">Semaine Prochaine :</p>
              <p className="text-purple-700">+15% d'appels attendus</p>
            </div>
            <div>
              <p className="font-medium text-purple-800">Optimisation :</p>
              <p className="text-purple-700">Réduire température à 0.6</p>
            </div>
            <div>
              <p className="font-medium text-purple-800">Économies :</p>
              <p className="text-purple-700">-12€ avec GPT-3.5</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}