import { useState } from 'react';
import { BarChart3, Brain, Zap, TrendingUp } from 'lucide-react';
import AnalyticsDashboard from '@/components/analytics/AnalyticsDashboard';
import PredictiveAnalytics from '@/components/advanced/PredictiveAnalytics';
import OptimizationCenter from '@/components/optimization/OptimizationCenter';
import AutomationRules from '@/components/advanced/AutomationRules';

type TabType = 'analytics' | 'predictions' | 'optimization' | 'automation';

export default function Analytics() {
  const [activeTab, setActiveTab] = useState<TabType>('analytics');

  const tabs = [
    { id: 'analytics', label: 'Analytics', icon: BarChart3, component: AnalyticsDashboard },
    { id: 'predictions', label: 'Prédictions', icon: Brain, component: PredictiveAnalytics },
    { id: 'optimization', label: 'Optimisation', icon: TrendingUp, component: OptimizationCenter },
    { id: 'automation', label: 'Automatisation', icon: Zap, component: AutomationRules },
  ];

  const ActiveComponent = tabs.find(tab => tab.id === activeTab)?.component || AnalyticsDashboard;

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="flex overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabType)}
              className={`flex items-center px-6 py-4 text-sm font-medium border-b-2 whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600 bg-blue-50'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <tab.icon className="w-5 h-5 mr-2" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Active Tab Content */}
      <ActiveComponent />
    </div>
  );
}