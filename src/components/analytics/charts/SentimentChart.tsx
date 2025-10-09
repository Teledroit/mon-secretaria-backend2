import { Heart, Meh, Frown } from 'lucide-react';

interface SentimentChartProps {
  data: {
    positive: number;
    neutral: number;
    negative: number;
  };
}

export default function SentimentChart({ data }: SentimentChartProps) {
  const total = data.positive + data.neutral + data.negative;
  
  const percentages = {
    positive: total > 0 ? (data.positive / total) * 100 : 0,
    neutral: total > 0 ? (data.neutral / total) * 100 : 0,
    negative: total > 0 ? (data.negative / total) * 100 : 0
  };

  const sentiments = [
    { 
      label: 'Positif', 
      count: data.positive, 
      percentage: percentages.positive,
      color: 'bg-green-500',
      icon: Heart,
      textColor: 'text-green-600'
    },
    { 
      label: 'Neutre', 
      count: data.neutral, 
      percentage: percentages.neutral,
      color: 'bg-gray-400',
      icon: Meh,
      textColor: 'text-gray-600'
    },
    { 
      label: 'Négatif', 
      count: data.negative, 
      percentage: percentages.negative,
      color: 'bg-red-500',
      icon: Frown,
      textColor: 'text-red-600'
    }
  ];

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
      <h3 className="text-lg font-medium mb-6">Analyse des Sentiments</h3>

      {/* Donut Chart Simulation */}
      <div className="flex justify-center mb-6">
        <div className="relative w-32 h-32">
          <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 36 36">
            <path
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              fill="none"
              stroke="#e5e7eb"
              strokeWidth="3"
            />
            {/* Positive segment */}
            <path
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              fill="none"
              stroke="#10b981"
              strokeWidth="3"
              strokeDasharray={`${percentages.positive}, 100`}
            />
            {/* Neutral segment */}
            <path
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              fill="none"
              stroke="#6b7280"
              strokeWidth="3"
              strokeDasharray={`${percentages.neutral}, 100`}
              strokeDashoffset={-percentages.positive}
            />
            {/* Negative segment */}
            <path
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              fill="none"
              stroke="#ef4444"
              strokeWidth="3"
              strokeDasharray={`${percentages.negative}, 100`}
              strokeDashoffset={-(percentages.positive + percentages.neutral)}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">{total}</p>
              <p className="text-xs text-gray-500">Appels</p>
            </div>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="space-y-3">
        {sentiments.map((sentiment) => (
          <div key={sentiment.label} className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <sentiment.icon className={`w-5 h-5 ${sentiment.textColor}`} />
              <span className="text-sm font-medium">{sentiment.label}</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">{sentiment.count}</span>
              <span className="text-sm font-medium">{sentiment.percentage.toFixed(1)}%</span>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 p-4 bg-green-50 rounded-lg">
        <h4 className="font-medium text-green-900 mb-2">🎯 Score de Satisfaction</h4>
        <div className="text-sm text-green-800">
          <p>Score global : <span className="font-bold">{(percentages.positive * 0.8 + percentages.neutral * 0.5).toFixed(1)}/100</span></p>
          <p className="mt-1">
            {percentages.positive > 70 ? '🌟 Excellent service client !' :
             percentages.positive > 50 ? '👍 Bon niveau de satisfaction' :
             '⚠️ Amélioration recommandée'}
          </p>
        </div>
      </div>
    </div>
  );
}