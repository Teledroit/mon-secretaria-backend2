import { Lightbulb, Clock, Phone, Calendar } from 'lucide-react';
import { CallInsights } from '@/lib/analytics/call-analytics';

interface InsightsPanelProps {
  insights: CallInsights;
}

export default function InsightsPanel({ insights }: InsightsPanelProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
      <div className="flex items-center gap-2 mb-6">
        <Lightbulb className="w-5 h-5 text-yellow-600" />
        <h3 className="text-lg font-medium">Insights Intelligents</h3>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Busy Periods */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-blue-600" />
            <h4 className="font-medium">Périodes d'Affluence</h4>
          </div>
          <div className="space-y-2">
            {insights.busyPeriods.slice(0, 3).map((period, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm font-medium">{period.start} - {period.end}</span>
                <div className="flex items-center space-x-2">
                  <div className="w-16 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full" 
                      style={{ width: `${period.intensity * 100}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-600">{Math.round(period.intensity * 100)}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Common Questions */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Phone className="w-4 h-4 text-green-600" />
            <h4 className="font-medium">Questions Fréquentes</h4>
          </div>
          <div className="space-y-2">
            {insights.commonQuestions.slice(0, 3).map((question, index) => (
              <div key={index} className="p-3 bg-gray-50 rounded-lg">
                <p className="text-sm font-medium mb-1">{question.question}</p>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-600">{question.frequency} fois</span>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    question.avgSentiment === 'positive' ? 'bg-green-100 text-green-800' :
                    question.avgSentiment === 'negative' ? 'bg-red-100 text-red-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {question.avgSentiment}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Transfer Reasons */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Phone className="w-4 h-4 text-orange-600" />
            <h4 className="font-medium">Raisons de Transfert</h4>
          </div>
          <div className="space-y-2">
            {insights.transferReasons.map((reason, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm font-medium">{reason.reason}</span>
                <span className="text-sm text-gray-600">{reason.count} fois</span>
              </div>
            ))}
          </div>
        </div>

        {/* Appointment Types */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-purple-600" />
            <h4 className="font-medium">Types de Rendez-vous</h4>
          </div>
          <div className="space-y-2">
            {insights.appointmentTypes.map((type, index) => (
              <div key={index} className="p-3 bg-gray-50 rounded-lg">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm font-medium">{type.type}</span>
                  <span className="text-sm text-gray-600">{type.count}</span>
                </div>
                <p className="text-xs text-gray-500">Durée moyenne : {type.avgDuration}min</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* AI Recommendations */}
      <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
        <h4 className="font-medium text-gray-900 mb-3">🤖 Recommandations IA</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div className="space-y-2">
            <p className="font-medium text-blue-900">Optimisations Suggérées :</p>
            <ul className="text-blue-800 space-y-1">
              <li>• Ajuster la température IA pendant les pics</li>
              <li>• Personnaliser les réponses fréquentes</li>
              <li>• Optimiser les transferts automatiques</li>
            </ul>
          </div>
          <div className="space-y-2">
            <p className="font-medium text-purple-900">Améliorations Détectées :</p>
            <ul className="text-purple-800 space-y-1">
              <li>• Réduction du temps de réponse</li>
              <li>• Amélioration du sentiment client</li>
              <li>• Augmentation des conversions</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}