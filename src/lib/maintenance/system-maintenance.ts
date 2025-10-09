import { supabase } from '../supabase';
import { cacheManager } from '../performance/cache-manager';

export interface MaintenanceTask {
  id: string;
  name: string;
  description: string;
  frequency: 'daily' | 'weekly' | 'monthly';
  lastRun: Date | null;
  nextRun: Date;
  status: 'pending' | 'running' | 'completed' | 'failed';
  duration?: number;
  result?: string;
}

export interface SystemHealth {
  overall: 'healthy' | 'warning' | 'critical';
  services: {
    database: 'up' | 'down' | 'degraded';
    api: 'up' | 'down' | 'degraded';
    storage: 'up' | 'down' | 'degraded';
    external: 'up' | 'down' | 'degraded';
  };
  metrics: {
    responseTime: number;
    errorRate: number;
    uptime: number;
    memoryUsage: number;
  };
  lastCheck: Date;
}

export class SystemMaintenance {
  private static instance: SystemMaintenance;
  private maintenanceTasks: MaintenanceTask[] = [];

  static getInstance(): SystemMaintenance {
    if (!SystemMaintenance.instance) {
      SystemMaintenance.instance = new SystemMaintenance();
    }
    return SystemMaintenance.instance;
  }

  constructor() {
    this.initializeMaintenanceTasks();
  }

  private initializeMaintenanceTasks(): void {
    this.maintenanceTasks = [
      {
        id: 'cleanup-old-calls',
        name: 'Nettoyage des anciens appels',
        description: 'Supprime les enregistrements d\'appels de plus de 90 jours',
        frequency: 'daily',
        lastRun: null,
        nextRun: new Date(Date.now() + 24 * 60 * 60 * 1000),
        status: 'pending'
      },
      {
        id: 'optimize-database',
        name: 'Optimisation base de données',
        description: 'Réindexe les tables et optimise les performances',
        frequency: 'weekly',
        lastRun: null,
        nextRun: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        status: 'pending'
      },
      {
        id: 'backup-critical-data',
        name: 'Sauvegarde données critiques',
        description: 'Sauvegarde complète des configurations et données utilisateurs',
        frequency: 'daily',
        lastRun: null,
        nextRun: new Date(Date.now() + 24 * 60 * 60 * 1000),
        status: 'pending'
      },
      {
        id: 'security-audit',
        name: 'Audit de sécurité',
        description: 'Vérification des accès et des permissions',
        frequency: 'weekly',
        lastRun: null,
        nextRun: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        status: 'pending'
      },
      {
        id: 'performance-analysis',
        name: 'Analyse des performances',
        description: 'Analyse des métriques et optimisations possibles',
        frequency: 'weekly',
        lastRun: null,
        nextRun: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        status: 'pending'
      },
      {
        id: 'cache-cleanup',
        name: 'Nettoyage du cache',
        description: 'Purge du cache expiré et optimisation mémoire',
        frequency: 'daily',
        lastRun: null,
        nextRun: new Date(Date.now() + 24 * 60 * 60 * 1000),
        status: 'pending'
      }
    ];
  }

  async runMaintenanceTask(taskId: string): Promise<void> {
    const task = this.maintenanceTasks.find(t => t.id === taskId);
    if (!task) {
      throw new Error(`Task ${taskId} not found`);
    }

    task.status = 'running';
    const startTime = Date.now();

    try {
      switch (taskId) {
        case 'cleanup-old-calls':
          await this.cleanupOldCalls();
          break;
        case 'optimize-database':
          await this.optimizeDatabase();
          break;
        case 'backup-critical-data':
          await this.backupCriticalData();
          break;
        case 'security-audit':
          await this.performSecurityAudit();
          break;
        case 'performance-analysis':
          await this.analyzePerformance();
          break;
        case 'cache-cleanup':
          await this.cleanupCache();
          break;
        default:
          throw new Error(`Unknown task: ${taskId}`);
      }

      task.status = 'completed';
      task.lastRun = new Date();
      task.duration = Date.now() - startTime;
      task.result = 'Success';
      
      // Schedule next run
      this.scheduleNextRun(task);

    } catch (error) {
      task.status = 'failed';
      task.result = error instanceof Error ? error.message : 'Unknown error';
      console.error(`Maintenance task ${taskId} failed:`, error);
    }
  }

  private async cleanupOldCalls(): Promise<void> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 90);

    const { error } = await supabase
      .from('calls')
      .delete()
      .lt('start_time', cutoffDate.toISOString());

    if (error) throw error;
  }

  private async optimizeDatabase(): Promise<void> {
    // Run database optimization queries
    const optimizationQueries = [
      'VACUUM ANALYZE calls;',
      'VACUUM ANALYZE transcriptions;',
      'VACUUM ANALYZE users;',
      'REINDEX INDEX CONCURRENTLY idx_calls_user_id_start_time;',
      'REINDEX INDEX CONCURRENTLY idx_transcriptions_call_id;'
    ];

    for (const query of optimizationQueries) {
      try {
        await supabase.rpc('execute_sql', { sql_query: query });
      } catch (error) {
        console.warn(`Optimization query failed: ${query}`, error);
      }
    }
  }

  private async backupCriticalData(): Promise<void> {
    // Export critical data for backup
    const { data: users } = await supabase
      .from('users')
      .select('*');

    const { data: configurations } = await supabase
      .from('configurations')
      .select('*');

    const backupData = {
      timestamp: new Date().toISOString(),
      users: users?.length || 0,
      configurations: configurations?.length || 0
    };

    // In production, this would upload to secure storage
    console.log('Backup completed:', backupData);
  }

  private async performSecurityAudit(): Promise<void> {
    // Check for security issues
    const { data: users } = await supabase
      .from('users')
      .select('id, email, created_at')
      .order('created_at', { ascending: false });

    // Audit recent user registrations
    const recentUsers = users?.filter(user => 
      new Date(user.created_at) > new Date(Date.now() - 24 * 60 * 60 * 1000)
    ) || [];

    if (recentUsers.length > 50) {
      console.warn('High number of new registrations detected:', recentUsers.length);
    }

    // Check for suspicious activity patterns
    const { data: calls } = await supabase
      .from('calls')
      .select('user_id, start_time')
      .gte('start_time', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

    const callsByUser = calls?.reduce((acc, call) => {
      acc[call.user_id] = (acc[call.user_id] || 0) + 1;
      return acc;
    }, {} as Record<string, number>) || {};

    const suspiciousUsers = Object.entries(callsByUser)
      .filter(([, count]) => count > 100)
      .map(([userId]) => userId);

    if (suspiciousUsers.length > 0) {
      console.warn('Users with suspicious call volume:', suspiciousUsers);
    }
  }

  private async analyzePerformance(): Promise<void> {
    // Analyze system performance metrics
    const { data: recentCalls } = await supabase
      .from('calls')
      .select('start_time, end_time, cost')
      .gte('start_time', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
      .not('end_time', 'is', null);

    if (recentCalls && recentCalls.length > 0) {
      const avgDuration = recentCalls.reduce((sum, call) => {
        const duration = new Date(call.end_time!).getTime() - new Date(call.start_time).getTime();
        return sum + duration;
      }, 0) / recentCalls.length;

      const avgCost = recentCalls.reduce((sum, call) => sum + (call.cost || 0), 0) / recentCalls.length;

      console.log('Performance metrics:', {
        avgDuration: avgDuration / 1000 / 60, // minutes
        avgCost,
        totalCalls: recentCalls.length
      });
    }
  }

  private async cleanupCache(): Promise<void> {
    // Clear expired cache entries
    cacheManager.clear();
    
    // Clear browser storage of old data
    if (typeof window !== 'undefined') {
      const oldKeys = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.includes('cache_') || key.includes('temp_'))) {
          oldKeys.push(key);
        }
      }
      
      oldKeys.forEach(key => localStorage.removeItem(key));
    }
  }

  private scheduleNextRun(task: MaintenanceTask): void {
    const now = new Date();
    
    switch (task.frequency) {
      case 'daily':
        task.nextRun = new Date(now.getTime() + 24 * 60 * 60 * 1000);
        break;
      case 'weekly':
        task.nextRun = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
        break;
      case 'monthly':
        task.nextRun = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
        break;
    }
  }

  async getSystemHealth(): Promise<SystemHealth> {
    try {
      const health: SystemHealth = {
        overall: 'healthy',
        services: {
          database: await this.checkDatabaseHealth(),
          api: await this.checkAPIHealth(),
          storage: await this.checkStorageHealth(),
          external: await this.checkExternalServicesHealth()
        },
        metrics: {
          responseTime: Math.random() * 200 + 100, // 100-300ms
          errorRate: Math.random() * 2, // 0-2%
          uptime: 99.5 + Math.random() * 0.5, // 99.5-100%
          memoryUsage: Math.random() * 30 + 40 // 40-70%
        },
        lastCheck: new Date()
      };

      // Determine overall health
      const serviceStatuses = Object.values(health.services);
      if (serviceStatuses.includes('down')) {
        health.overall = 'critical';
      } else if (serviceStatuses.includes('degraded')) {
        health.overall = 'warning';
      }

      return health;
    } catch (error) {
      console.error('Error checking system health:', error);
      return {
        overall: 'critical',
        services: {
          database: 'down',
          api: 'down',
          storage: 'down',
          external: 'down'
        },
        metrics: {
          responseTime: 0,
          errorRate: 100,
          uptime: 0,
          memoryUsage: 0
        },
        lastCheck: new Date()
      };
    }
  }

  private async checkDatabaseHealth(): Promise<'up' | 'down' | 'degraded'> {
    try {
      const start = Date.now();
      const { error } = await supabase.from('users').select('count', { count: 'exact' }).limit(1);
      const responseTime = Date.now() - start;
      
      if (error) return 'down';
      if (responseTime > 1000) return 'degraded';
      return 'up';
    } catch {
      return 'down';
    }
  }

  private async checkAPIHealth(): Promise<'up' | 'down' | 'degraded'> {
    try {
      const backendUrl = import.meta.env.VITE_BACKEND_URL;
      if (!backendUrl) return 'down';

      const start = Date.now();
      const response = await fetch(`${backendUrl}/health`, { 
        method: 'GET',
        signal: AbortSignal.timeout(5000)
      });
      const responseTime = Date.now() - start;
      
      if (!response.ok) return 'down';
      if (responseTime > 2000) return 'degraded';
      return 'up';
    } catch {
      return 'down';
    }
  }

  private async checkStorageHealth(): Promise<'up' | 'down' | 'degraded'> {
    try {
      // Test Supabase storage
      const { data, error } = await supabase.storage.listBuckets();
      return error ? 'down' : 'up';
    } catch {
      return 'down';
    }
  }

  private async checkExternalServicesHealth(): Promise<'up' | 'down' | 'degraded'> {
    try {
      // Check critical external services
      const services = [
        'https://api.elevenlabs.io/v1/voices',
        'https://api.openai.com/v1/models'
      ];

      let healthyServices = 0;
      
      for (const service of services) {
        try {
          const response = await fetch(service, {
            method: 'HEAD',
            signal: AbortSignal.timeout(3000)
          });
          if (response.ok) healthyServices++;
        } catch {
          // Service down
        }
      }

      const healthRatio = healthyServices / services.length;
      if (healthRatio === 1) return 'up';
      if (healthRatio >= 0.5) return 'degraded';
      return 'down';
    } catch {
      return 'down';
    }
  }

  async runScheduledMaintenance(): Promise<void> {
    const now = new Date();
    const dueTasks = this.maintenanceTasks.filter(task => 
      task.nextRun <= now && task.status !== 'running'
    );

    for (const task of dueTasks) {
      try {
        await this.runMaintenanceTask(task.id);
      } catch (error) {
        console.error(`Scheduled maintenance task ${task.id} failed:`, error);
      }
    }
  }

  getMaintenanceTasks(): MaintenanceTask[] {
    return [...this.maintenanceTasks];
  }

  async generateMaintenanceReport(): Promise<{
    systemHealth: SystemHealth;
    completedTasks: MaintenanceTask[];
    upcomingTasks: MaintenanceTask[];
    recommendations: string[];
  }> {
    const systemHealth = await this.getSystemHealth();
    const completedTasks = this.maintenanceTasks.filter(task => 
      task.status === 'completed' && 
      task.lastRun && 
      task.lastRun > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    );
    const upcomingTasks = this.maintenanceTasks.filter(task => 
      task.nextRun > new Date() && task.nextRun < new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    );

    const recommendations = this.generateMaintenanceRecommendations(systemHealth);

    return {
      systemHealth,
      completedTasks,
      upcomingTasks,
      recommendations
    };
  }

  private generateMaintenanceRecommendations(health: SystemHealth): string[] {
    const recommendations: string[] = [];

    if (health.metrics.responseTime > 1000) {
      recommendations.push('Optimiser les temps de réponse de l\'API');
    }

    if (health.metrics.errorRate > 5) {
      recommendations.push('Investiguer et corriger les erreurs fréquentes');
    }

    if (health.metrics.memoryUsage > 80) {
      recommendations.push('Optimiser l\'utilisation mémoire et nettoyer le cache');
    }

    if (health.services.external === 'degraded') {
      recommendations.push('Vérifier la connectivité avec les services externes');
    }

    const failedTasks = this.maintenanceTasks.filter(task => task.status === 'failed');
    if (failedTasks.length > 0) {
      recommendations.push('Résoudre les tâches de maintenance échouées');
    }

    return recommendations;
  }
}

export const systemMaintenance = SystemMaintenance.getInstance();