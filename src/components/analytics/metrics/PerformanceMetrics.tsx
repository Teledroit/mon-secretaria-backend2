import { Zap, Target, Clock, TrendingUp } from 'lucide-react';
import { CallAnalytics } from '@/lib/analytics/call-analytics';

interface PerformanceMetricsProps {
  analytics: CallAnalytics;
}

export default function PerformanceMetrics({ analytics }: PerformanceMetricsProps) {
  const calculateEfficiencyScore = () => {
    const conversionWeight = analytics.conversionRate * 0.4;
    const sentimentWeight = (analytics.sentimentDistribution.positive / 
      (analytics.sentimentDistribution.positive + analytics.sentimentDistribution.neutral + analytics.sentimentDistribution.negative) || 1) * 100 * 0.3;
    const durationWeight = analytics.averageDuration > 0 && analytics.averageDuration < 10 ? 30 : 
                          analytics.averageDuration < 20 ? 20 : 10;
    
    return Math.min(100, conversionWeight + sentimentWeight + durationWeight);
  };

  const efficiencyScore = calculateEfficiencyScore();

  const metrics = [
    {
      icon: Zap,
      title: 'Score d\'Efficacité',
      value: `${efficiencyScore.toFixed(1)}/100`,
      change: '+12%',
      positive: true,
      description: 'Performance globale de l\'assistant IA'
    },
    {
      icon: Target,
      title: 'Précision des Réponses',
      value: '94.2%',
      change: '+5%',
      positive: true,
      description: 'Pourcentage de réponses appropriées'
    },
    {
      icon: Clock,
      title: 'Temps de Réponse',
      value: '1.2s',
      change: '-0.3s',
      positive: true,
      description: 'Latence moyenne de l\'IA'
    },
    {
      icon: TrendingUp,
      title: 'Amélioration Continue',
      value: '+8.5%',
      change: 'ce mois',
      positive: true,
      description: 'Progression des performances'
    }
  ];

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
      <h3 className="text-lg font-medium mb-6">Métriques de Performance IA</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics.map((metric, index) => (
          <div key={index} className="text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-50 rounded-lg mb-3">
              <metric.icon className="w-6 h-6 text-blue-600" />
            </div>
            <h4 className="font-medium text-gray-900 mb-1">{metric.title}</h4>
            <p className="text-2xl font-bold text-gray-900 mb-1">{metric.value}</p>
            <div className="flex items-center justify-center space-x-1">
              <span className={`text-sm font-medium ${
                metric.positive ? 'text-green-600' : 'text-red-600'
              }`}>
                {metric.change}
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-2">{metric.description}</p>
          </div>
        ))}
      </div>

      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 bg-green-50 rounded-lg">
          <h4 className="font-medium text-green-900 mb-2">🎯 Points Forts</h4>
          <ul className="text-sm text-green-800 space-y-1">
            <li>• Taux de conversion élevé</li>
            <li>• Réponses rapides et précises</li>
            <li>• Satisfaction client excellente</li>
          </ul>
        </div>

        <div className="p-4 bg-blue-50 rounded-lg">
          <h4 className="font-medium text-blue-900 mb-2">📈 Améliorations</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Optimisation heures de pointe</li>
            <li>• Personnalisation avancée</li>
            <li>• Intégration workflow</li>
          </ul>
        </div>

        <div className="p-4 bg-purple-50 rounded-lg">
          <h4 className="font-medium text-purple-900 mb-2">🚀 Prochaines Étapes</h4>
          <ul className="text-sm text-purple-800 space-y-1">
            <li>• IA prédictive</li>
            <li>• Analytics temps réel</li>
            <li>• Automatisation avancée</li>
          </ul>
        </div>
      </div>
    </div>
  );
}