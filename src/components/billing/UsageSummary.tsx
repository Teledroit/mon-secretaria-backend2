import { BarChart3, Clock, Phone, TrendingUp } from 'lucide-react';

interface UsageSummaryProps {
  currentUsage: {
    minutes: number;
    cost: number;
    averageCostPerMinute: number;
    totalCalls: number;
    activeDays: number;
    averageCallsPerDay: number;
  };
  limits: {
    calls: number;
    remaining: number;
  };
}

export default function UsageSummary({ currentUsage, limits }: UsageSummaryProps) {
  const isUnlimited = limits.calls === Infinity;
  const usagePercentage = isUnlimited ? 0 : Math.min((currentUsage.totalCalls / limits.calls) * 100, 100);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <Phone className="w-5 h-5 text-blue-600" />
          <span className="text-sm text-gray-500">Période en cours</span>
        </div>
        <div className="space-y-2">
          <p className="text-2xl font-semibold">{currentUsage.totalCalls} appels</p>
          {!isUnlimited && (
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full" 
                style={{ width: `${usagePercentage}%` }}
              />
            </div>
          )}
          <p className="text-sm text-gray-600">
            {isUnlimited ? (
              <span className="text-green-600 font-medium">Appels illimités</span>
            ) : (
              `${limits.remaining} appels restants`
            )}
          </p>
          <p className="text-sm text-gray-600">
            {currentUsage.minutes} minutes d'IA utilisées
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <BarChart3 className="w-5 h-5 text-blue-600" />
          <span className="text-sm text-gray-500">Coût total</span>
        </div>
        <p className="text-2xl font-semibold">{currentUsage.cost}€</p>
        <p className="text-sm text-gray-600 mt-2">
          Facturation à l'usage de l'IA
        </p>
        <p className="text-sm text-gray-600">
          ~{currentUsage.averageCallsPerDay} appels/jour en moyenne
        </p>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <TrendingUp className="w-5 h-5 text-blue-600" />
          <span className="text-sm text-gray-500">Coût moyen</span>
        </div>
        <p className="text-2xl font-semibold">{currentUsage.averageCostPerMinute}€</p>
        <p className="text-sm text-gray-600 mt-2">
          Par minute
        </p>
        <p className="text-sm text-gray-600">
          Basé sur {currentUsage.minutes} minutes d'utilisation
        </p>
      </div>
    </div>
  );
}