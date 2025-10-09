import { useState, useEffect } from 'react';
import { Zap, TrendingUp, DollarSign, Brain, CheckCircle, AlertTriangle } from 'lucide-react';
import Button from '@/components/ui/Button';
import { performanceMonitor, OptimizationSuggestion } from '@/lib/optimization/performance-monitor';
import { useAuth } from '@/lib/AuthContext';

export default function OptimizationCenter() {
  const [suggestions, setSuggestions] = useState<OptimizationSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [appliedOptimizations, setAppliedOptimizations] = useState<string[]>([]);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      loadSuggestions();
    }
  }, [user]);

  const loadSuggestions = async () => {
    if (!user) return;

    try {
      const optimizations = await performanceMonitor.generateOptimizationSuggestions(user.id);
      setSuggestions(optimizations);
    } catch (error) {
      console.error('Error loading optimization suggestions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const applyOptimization = async (suggestion: OptimizationSuggestion) => {
    try {
      // Simulate applying optimization
      setAppliedOptimizations(prev => [...prev, suggestion.title]);
      
      // In a real implementation, this would apply the actual optimization
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      alert(`Optimisation "${suggestion.title}" appliquée avec succès !`);
      
    } catch (error) {
      console.error('Error applying optimization:', error);
      alert('Erreur lors de l\'application de l\'optimisation');
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'performance': return TrendingUp;
      case 'cost': return DollarSign;
      case 'quality': return Brain;
      default: return Zap;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'performance': return 'text-blue-600 bg-blue-50';
      case 'cost': return 'text-green-600 bg-green-50';
      case 'quality': return 'text-purple-600 bg-purple-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-50 border-red-200';
      case 'medium': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'low': return 'text-blue-600 bg-blue-50 border-blue-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
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
        <h1 className="text-2xl font-semibold text-gray-900">Centre d'Optimisation</h1>
        <Button onClick={loadSuggestions} variant="outline">
          <Zap className="w-4 h-4 mr-2" />
          Actualiser les Suggestions
        </Button>
      </div>

      {/* Performance Overview */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <h2 className="text-lg font-medium mb-4">Vue d'Ensemble des Performances</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-green-600">{appliedOptimizations.length}</p>
            <p className="text-sm text-green-800">Optimisations Appliquées</p>
          </div>
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <TrendingUp className="w-8 h-8 text-blue-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-blue-600">94.2%</p>
            <p className="text-sm text-blue-800">Score de Performance</p>
          </div>
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <Brain className="w-8 h-8 text-purple-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-purple-600">1.2s</p>
            <p className="text-sm text-purple-800">Temps de Réponse Moyen</p>
          </div>
          <div className="text-center p-4 bg-orange-50 rounded-lg">
            <DollarSign className="w-8 h-8 text-orange-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-orange-600">-23%</p>
            <p className="text-sm text-orange-800">Réduction des Coûts</p>
          </div>
        </div>
      </div>

      {/* Optimization Suggestions */}
      <div className="space-y-4">
        <h2 className="text-lg font-medium">Suggestions d'Optimisation</h2>
        
        {suggestions.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-8 border border-gray-100 text-center">
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Système Optimisé</h3>
            <p className="text-gray-600">
              Aucune optimisation supplémentaire recommandée pour le moment.
              Votre système fonctionne de manière optimale !
            </p>
          </div>
        ) : (
          suggestions.map((suggestion, index) => {
            const TypeIcon = getTypeIcon(suggestion.type);
            const isApplied = appliedOptimizations.includes(suggestion.title);
            
            return (
              <div key={index} className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4 flex-1">
                    <div className={`p-3 rounded-lg ${getTypeColor(suggestion.type)}`}>
                      <TypeIcon className="w-6 h-6" />
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-medium text-gray-900">{suggestion.title}</h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getPriorityColor(suggestion.priority)}`}>
                          {suggestion.priority === 'high' ? 'Priorité Haute' :
                           suggestion.priority === 'medium' ? 'Priorité Moyenne' : 'Priorité Basse'}
                        </span>
                        {isApplied && (
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            ✓ Appliqué
                          </span>
                        )}
                      </div>
                      
                      <p className="text-gray-600 mb-3">{suggestion.description}</p>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="font-medium text-gray-700 mb-1">Impact Attendu :</p>
                          <p className="text-green-600">{suggestion.impact}</p>
                        </div>
                        <div>
                          <p className="font-medium text-gray-700 mb-1">Implémentation :</p>
                          <p className="text-blue-600">{suggestion.implementation}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="ml-4">
                    {!isApplied ? (
                      <Button
                        onClick={() => applyOptimization(suggestion)}
                        className="whitespace-nowrap"
                      >
                        Appliquer
                      </Button>
                    ) : (
                      <div className="flex items-center text-green-600">
                        <CheckCircle className="w-5 h-5 mr-2" />
                        <span className="text-sm font-medium">Appliqué</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Auto-Optimization Settings */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <h2 className="text-lg font-medium mb-4">Optimisation Automatique</h2>
        <div className="space-y-4">
          <label className="flex items-center space-x-3">
            <input
              type="checkbox"
              defaultChecked
              className="rounded text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm font-medium text-gray-700">
              Activer l'optimisation automatique des performances
            </span>
          </label>
          
          <label className="flex items-center space-x-3">
            <input
              type="checkbox"
              defaultChecked
              className="rounded text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm font-medium text-gray-700">
              Optimisation automatique des coûts
            </span>
          </label>
          
          <label className="flex items-center space-x-3">
            <input
              type="checkbox"
              className="rounded text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm font-medium text-gray-700">
              Ajustement automatique de la température IA selon la charge
            </span>
          </label>
        </div>
        
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <h4 className="font-medium text-blue-900 mb-2">🤖 IA d'Optimisation Active</h4>
          <p className="text-sm text-blue-800">
            L'IA surveille en continu les performances et applique automatiquement 
            les optimisations mineures pour maintenir un service optimal.
          </p>
        </div>
      </div>
    </div>
  );
}