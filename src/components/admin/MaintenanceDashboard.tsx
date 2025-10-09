import { useState, useEffect } from 'react';
import { 
  Settings, 
  Play, 
  Clock, 
  CheckCircle, 
  AlertTriangle, 
  Activity,
  Database,
  Shield,
  Zap,
  RefreshCw
} from 'lucide-react';
import Button from '@/components/ui/Button';
import { systemMaintenance, MaintenanceTask, SystemHealth } from '@/lib/maintenance/system-maintenance';

export default function MaintenanceDashboard() {
  const [tasks, setTasks] = useState<MaintenanceTask[]>([]);
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [runningTasks, setRunningTasks] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadMaintenanceData();
    
    // Actualiser toutes les minutes
    const interval = setInterval(loadMaintenanceData, 60000);
    return () => clearInterval(interval);
  }, []);

  const loadMaintenanceData = async () => {
    try {
      const [tasksData, healthData] = await Promise.all([
        systemMaintenance.getMaintenanceTasks(),
        systemMaintenance.getSystemHealth()
      ]);

      setTasks(tasksData);
      setSystemHealth(healthData);
    } catch (error) {
      console.error('Error loading maintenance data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const runTask = async (taskId: string) => {
    try {
      setRunningTasks(prev => new Set(prev).add(taskId));
      await systemMaintenance.runMaintenanceTask(taskId);
      await loadMaintenanceData();
    } catch (error) {
      console.error('Error running maintenance task:', error);
      alert('Erreur lors de l\'exécution de la tâche');
    } finally {
      setRunningTasks(prev => {
        const newSet = new Set(prev);
        newSet.delete(taskId);
        return newSet;
      });
    }
  };

  const getTaskStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'running': return <Activity className="w-5 h-5 text-blue-600 animate-spin" />;
      case 'failed': return <AlertTriangle className="w-5 h-5 text-red-600" />;
      default: return <Clock className="w-5 h-5 text-gray-600" />;
    }
  };

  const getServiceStatusColor = (status: string) => {
    switch (status) {
      case 'up': return 'text-green-600 bg-green-50 border-green-200';
      case 'degraded': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'down': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
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
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-gray-900">Maintenance Système</h1>
        <Button onClick={loadMaintenanceData} variant="outline">
          <RefreshCw className="w-4 h-4 mr-2" />
          Actualiser
        </Button>
      </div>

      {/* État du système */}
      {systemHealth && (
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <h2 className="text-lg font-medium mb-4">État du Système</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            {Object.entries(systemHealth.services).map(([service, status]) => (
              <div key={service} className={`p-4 rounded-lg border ${getServiceStatusColor(status)}`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium capitalize">{service}</span>
                  <div className={`w-3 h-3 rounded-full ${
                    status === 'up' ? 'bg-green-500' :
                    status === 'degraded' ? 'bg-yellow-500' : 'bg-red-500'
                  }`} />
                </div>
                <p className="text-sm opacity-75">
                  {status === 'up' ? 'Opérationnel' :
                   status === 'degraded' ? 'Dégradé' : 'Hors service'}
                </p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-2xl font-bold text-blue-600">{systemHealth.metrics.responseTime.toFixed(0)}ms</p>
              <p className="text-sm text-gray-600">Temps de réponse</p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-2xl font-bold text-green-600">{systemHealth.metrics.errorRate.toFixed(1)}%</p>
              <p className="text-sm text-gray-600">Taux d'erreur</p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-2xl font-bold text-purple-600">{systemHealth.metrics.uptime.toFixed(1)}%</p>
              <p className="text-sm text-gray-600">Disponibilité</p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-2xl font-bold text-orange-600">{systemHealth.metrics.memoryUsage.toFixed(0)}%</p>
              <p className="text-sm text-gray-600">Utilisation mémoire</p>
            </div>
          </div>
        </div>
      )}

      {/* Tâches de maintenance */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <h2 className="text-lg font-medium mb-4">Tâches de Maintenance</h2>
        <div className="space-y-4">
          {tasks.map((task) => (
            <div key={task.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-4 flex-1">
                {getTaskStatusIcon(task.status)}
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900">{task.name}</h3>
                  <p className="text-sm text-gray-600">{task.description}</p>
                  <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                    <span>Fréquence: {task.frequency}</span>
                    {task.lastRun && (
                      <span>Dernière exécution: {task.lastRun.toLocaleDateString('fr-FR')}</span>
                    )}
                    <span>Prochaine: {task.nextRun.toLocaleDateString('fr-FR')}</span>
                    {task.duration && (
                      <span>Durée: {(task.duration / 1000).toFixed(1)}s</span>
                    )}
                  </div>
                </div>
              </div>
              
              <Button
                onClick={() => runTask(task.id)}
                disabled={runningTasks.has(task.id) || task.status === 'running'}
                variant="outline"
                size="sm"
              >
                {runningTasks.has(task.id) || task.status === 'running' ? (
                  <>
                    <Activity className="w-4 h-4 mr-2 animate-spin" />
                    En cours...
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 mr-2" />
                    Exécuter
                  </>
                )}
              </Button>
            </div>
          ))}
        </div>
      </div>

      {/* Actions rapides */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <h2 className="text-lg font-medium mb-4">Actions Rapides</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Button
            onClick={() => systemMaintenance.runScheduledMaintenance()}
            className="flex items-center justify-center"
          >
            <Settings className="w-4 h-4 mr-2" />
            Maintenance Complète
          </Button>
          <Button
            onClick={() => window.location.reload()}
            variant="outline"
            className="flex items-center justify-center"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Redémarrer Interface
          </Button>
          <Button
            onClick={() => {
              if (confirm('Êtes-vous sûr de vouloir vider le cache ?')) {
                localStorage.clear();
                sessionStorage.clear();
                window.location.reload();
              }
            }}
            variant="outline"
            className="flex items-center justify-center text-red-600 hover:text-red-700"
          >
            <Database className="w-4 h-4 mr-2" />
            Vider le Cache
          </Button>
        </div>
      </div>
    </div>
  );
}