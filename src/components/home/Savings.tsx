import { Calculator, TrendingUp, Clock, DollarSign } from 'lucide-react';

const monthlyStats = {
  workingDays: 22,
  averageCalls: 35,
  averageCallDuration: 5, // en minutes
  standardisteSalary: 2500, // SMIC + charges
  standardisteOtherCosts: 500, // autres coûts (formation, congés, etc.)
};

const calculateMonthlyStats = () => {
  const totalMinutes = monthlyStats.workingDays * monthlyStats.averageCalls * monthlyStats.averageCallDuration;
  const standardisteCost = monthlyStats.standardisteSalary + monthlyStats.standardisteOtherCosts;
  const aiCost = 99 + (totalMinutes * 0.15); // Plan Pro + coût par minute
  const savings = standardisteCost - aiCost;
  const savingsPercentage = Math.round((savings / standardisteCost) * 100);

  return {
    totalMinutes,
    standardisteCost,
    aiCost,
    savings,
    savingsPercentage
  };
};

export default function Savings() {
  const stats = calculateMonthlyStats();

  return (
    <section className="py-24 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4">
            Réalisez des <span className="gradient-text">Économies Substantielles</span>
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Estimation comparative des coûts entre un standardiste traditionnel et notre solution IA
            (données à titre illustratif uniquement)
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto mb-12">
          <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-100">
            <h3 className="text-xl font-semibold mb-6">Standardiste Traditionnel</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Salaire mensuel (charges incluses)</span>
                <span className="font-semibold">{monthlyStats.standardisteSalary}€</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Autres coûts mensuels</span>
                <span className="font-semibold">{monthlyStats.standardisteOtherCosts}€</span>
              </div>
              <div className="pt-4 border-t">
                <div className="flex justify-between items-center">
                  <span className="font-semibold">Coût total mensuel</span>
                  <span className="text-xl font-bold">{stats.standardisteCost}€</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl shadow-lg p-8 border border-blue-100">
            <h3 className="text-xl font-semibold mb-6">Assistant IA</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Abonnement mensuel (Plan Pro)</span>
                <span className="font-semibold">99€</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Coût des minutes ({stats.totalMinutes} min)</span>
                <span className="font-semibold">{Math.round(stats.totalMinutes * 0.15)}€</span>
              </div>
              <div className="pt-4 border-t">
                <div className="flex justify-between items-center">
                  <span className="font-semibold">Coût total mensuel</span>
                  <span className="text-xl font-bold">{Math.round(stats.aiCost)}€</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-8 text-white max-w-3xl mx-auto">
          <div className="text-center">
            <h3 className="text-2xl font-bold mb-6">Économies Potentielles</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <DollarSign className="w-8 h-8 mx-auto mb-2 opacity-75" />
                <p className="text-3xl font-bold">{Math.round(stats.savings)}€</p>
                <p className="text-sm opacity-75">par mois</p>
              </div>
              <div>
                <TrendingUp className="w-8 h-8 mx-auto mb-2 opacity-75" />
                <p className="text-3xl font-bold">{stats.savingsPercentage}%</p>
                <p className="text-sm opacity-75">d'économies</p>
              </div>
              <div>
                <Calculator className="w-8 h-8 mx-auto mb-2 opacity-75" />
                <p className="text-3xl font-bold">{Math.round(stats.savings * 12)}€</p>
                <p className="text-sm opacity-75">par an</p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 text-center text-sm text-gray-500 max-w-2xl mx-auto">
          <p>
            * Ces calculs sont basés sur des moyennes et des estimations. Les coûts réels peuvent varier 
            selon votre situation spécifique, le volume d'appels, et d'autres facteurs.
          </p>
        </div>
      </div>
    </section>
  );
}