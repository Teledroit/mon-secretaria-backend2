import { supabase } from '../supabase';

export interface PerformanceMetrics {
  responseTime: number;
  errorRate: number;
  throughput: number;
  memoryUsage: number;
  cpuUsage: number;
}

export interface OptimizationSuggestion {
  type: 'performance' | 'cost' | 'quality';
  priority: 'low' | 'medium' | 'high';
  title: string;
  description: string;
  impact: string;
  implementation: string;
}

export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: PerformanceMetrics[] = [];
  private readonly MAX_METRICS = 100;

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  recordMetric(metric: PerformanceMetrics): void {
    this.metrics.push({
      ...metric,
      timestamp: Date.now()
    } as any);

    // Keep only recent metrics
    if (this.metrics.length > this.MAX_METRICS) {
      this.metrics = this.metrics.slice(-this.MAX_METRICS);
    }
  }

  getAverageMetrics(timeWindow: number = 5 * 60 * 1000): PerformanceMetrics {
    const cutoff = Date.now() - timeWindow;
    const recentMetrics = this.metrics.filter((m: any) => m.timestamp > cutoff);

    if (recentMetrics.length === 0) {
      return {
        responseTime: 0,
        errorRate: 0,
        throughput: 0,
        memoryUsage: 0,
        cpuUsage: 0
      };
    }

    return {
      responseTime: recentMetrics.reduce((sum, m) => sum + m.responseTime, 0) / recentMetrics.length,
      errorRate: recentMetrics.reduce((sum, m) => sum + m.errorRate, 0) / recentMetrics.length,
      throughput: recentMetrics.reduce((sum, m) => sum + m.throughput, 0) / recentMetrics.length,
      memoryUsage: recentMetrics.reduce((sum, m) => sum + m.memoryUsage, 0) / recentMetrics.length,
      cpuUsage: recentMetrics.reduce((sum, m) => sum + m.cpuUsage, 0) / recentMetrics.length
    };
  }

  async generateOptimizationSuggestions(userId: string): Promise<OptimizationSuggestion[]> {
    try {
      const suggestions: OptimizationSuggestion[] = [];
      const avgMetrics = this.getAverageMetrics();

      // Performance suggestions
      if (avgMetrics.responseTime > 2000) {
        suggestions.push({
          type: 'performance',
          priority: 'high',
          title: 'Optimiser le Temps de Réponse',
          description: 'Le temps de réponse moyen dépasse 2 secondes',
          impact: 'Amélioration de 40% de la satisfaction client',
          implementation: 'Réduire la température IA ou changer de moteur'
        });
      }

      if (avgMetrics.errorRate > 5) {
        suggestions.push({
          type: 'quality',
          priority: 'high',
          title: 'Réduire le Taux d\'Erreur',
          description: 'Taux d\'erreur élevé détecté dans les conversations',
          impact: 'Réduction de 60% des appels non résolus',
          implementation: 'Améliorer les instructions système et ajouter des exemples'
        });
      }

      // Cost optimization
      const { data: usage } = await supabase.rpc('get_current_usage_stats', {
        user_uuid: userId
      });

      if (usage && usage.total_cost > 100) {
        suggestions.push({
          type: 'cost',
          priority: 'medium',
          title: 'Optimiser les Coûts IA',
          description: 'Coût mensuel élevé détecté',
          impact: 'Économies potentielles de 30%',
          implementation: 'Passer à GPT-3.5 pour les conversations simples'
        });
      }

      // Quality improvements
      suggestions.push({
        type: 'quality',
        priority: 'medium',
        title: 'Améliorer la Personnalisation',
        description: 'Ajouter plus de contexte spécifique au cabinet',
        impact: 'Augmentation de 25% de la satisfaction',
        implementation: 'Enrichir les documents d\'instructions'
      });

      return suggestions;

    } catch (error) {
      console.error('Error generating optimization suggestions:', error);
      return [];
    }
  }

  startMonitoring(): void {
    // Monitor API response times
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      const start = performance.now();
      try {
        const response = await originalFetch(...args);
        const responseTime = performance.now() - start;
        
        this.recordMetric({
          responseTime,
          errorRate: response.ok ? 0 : 1,
          throughput: 1,
          memoryUsage: (performance as any).memory?.usedJSHeapSize || 0,
          cpuUsage: 0 // Browser doesn't expose CPU usage
        });

        return response;
      } catch (error) {
        this.recordMetric({
          responseTime: performance.now() - start,
          errorRate: 1,
          throughput: 0,
          memoryUsage: (performance as any).memory?.usedJSHeapSize || 0,
          cpuUsage: 0
        });
        throw error;
      }
    };
  }
}

export const performanceMonitor = PerformanceMonitor.getInstance();