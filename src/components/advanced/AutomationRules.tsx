import { useState, useEffect } from 'react';
import { Zap, Plus, Edit, Trash2, Play, Pause } from 'lucide-react';
import Button from '@/components/ui/Button';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/AuthContext';

interface AutomationRule {
  id: string;
  name: string;
  trigger: {
    type: 'keyword' | 'sentiment' | 'time' | 'call_volume';
    condition: string;
    value: string;
  };
  action: {
    type: 'transfer' | 'adjust_ai' | 'send_notification' | 'schedule_appointment';
    parameters: Record<string, any>;
  };
  enabled: boolean;
  priority: number;
  created_at: string;
}

export default function AutomationRules() {
  const [rules, setRules] = useState<AutomationRule[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [editingRule, setEditingRule] = useState<AutomationRule | null>(null);
  const [newRule, setNewRule] = useState<Partial<AutomationRule>>({
    name: '',
    trigger: { type: 'keyword', condition: 'contains', value: '' },
    action: { type: 'transfer', parameters: {} },
    enabled: true,
    priority: 1
  });
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchRules();
    }
  }, [user]);

  const fetchRules = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('workflows')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Convert workflows to automation rules format
      const automationRules: AutomationRule[] = data?.map(workflow => ({
        id: workflow.id,
        name: workflow.name,
        trigger: {
          type: 'keyword',
          condition: 'contains',
          value: workflow.trigger_keywords
        },
        action: {
          type: 'transfer', // Simplified for demo
          parameters: { steps: workflow.steps }
        },
        enabled: workflow.enabled,
        priority: 1,
        created_at: workflow.created_at
      })) || [];

      setRules(automationRules);

    } catch (error) {
      console.error('Error fetching automation rules:', error);
    }
  };

  const createRule = async () => {
    if (!user || !newRule.name || !newRule.trigger?.value) return;

    try {
      const { data, error } = await supabase
        .from('workflows')
        .insert({
          user_id: user.id,
          name: newRule.name,
          trigger_keywords: newRule.trigger.value,
          steps: [
            {
              type: newRule.action?.type,
              content: `Action automatique: ${newRule.action?.type}`,
              config: newRule.action?.parameters
            }
          ],
          enabled: newRule.enabled
        })
        .select()
        .single();

      if (error) throw error;

      await fetchRules();
      setIsCreating(false);
      setNewRule({
        name: '',
        trigger: { type: 'keyword', condition: 'contains', value: '' },
        action: { type: 'transfer', parameters: {} },
        enabled: true,
        priority: 1
      });

    } catch (error) {
      console.error('Error creating automation rule:', error);
      alert('Erreur lors de la création de la règle');
    }
  };

  const toggleRule = async (ruleId: string, enabled: boolean) => {
    try {
      const { error } = await supabase
        .from('workflows')
        .update({ enabled })
        .eq('id', ruleId);

      if (error) throw error;

      setRules(prev => prev.map(rule => 
        rule.id === ruleId ? { ...rule, enabled } : rule
      ));

    } catch (error) {
      console.error('Error toggling rule:', error);
    }
  };

  const deleteRule = async (ruleId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette règle ?')) return;

    try {
      const { error } = await supabase
        .from('workflows')
        .delete()
        .eq('id', ruleId);

      if (error) throw error;

      setRules(prev => prev.filter(rule => rule.id !== ruleId));

    } catch (error) {
      console.error('Error deleting rule:', error);
    }
  };

  const getTriggerIcon = (type: string) => {
    switch (type) {
      case 'keyword': return '🔤';
      case 'sentiment': return '😊';
      case 'time': return '⏰';
      case 'call_volume': return '📞';
      default: return '⚡';
    }
  };

  const getActionIcon = (type: string) => {
    switch (type) {
      case 'transfer': return '📞';
      case 'adjust_ai': return '🤖';
      case 'send_notification': return '📧';
      case 'schedule_appointment': return '📅';
      default: return '⚡';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Zap className="w-6 h-6 text-yellow-600" />
          <h1 className="text-2xl font-semibold text-gray-900">Règles d'Automatisation</h1>
        </div>
        <Button onClick={() => setIsCreating(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Nouvelle Règle
        </Button>
      </div>

      {/* Create/Edit Rule Form */}
      {(isCreating || editingRule) && (
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <h3 className="text-lg font-medium mb-4">
            {isCreating ? 'Créer une Nouvelle Règle' : 'Modifier la Règle'}
          </h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nom de la règle
              </label>
              <input
                type="text"
                value={newRule.name}
                onChange={(e) => setNewRule({ ...newRule, name: e.target.value })}
                placeholder="Ex: Transfert automatique urgences"
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Type de déclencheur
                </label>
                <select
                  value={newRule.trigger?.type}
                  onChange={(e) => setNewRule({
                    ...newRule,
                    trigger: { ...newRule.trigger!, type: e.target.value as any }
                  })}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  <option value="keyword">Mot-clé</option>
                  <option value="sentiment">Sentiment</option>
                  <option value="time">Heure</option>
                  <option value="call_volume">Volume d'appels</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Condition
                </label>
                <select
                  value={newRule.trigger?.condition}
                  onChange={(e) => setNewRule({
                    ...newRule,
                    trigger: { ...newRule.trigger!, condition: e.target.value }
                  })}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  <option value="contains">Contient</option>
                  <option value="equals">Égal à</option>
                  <option value="greater_than">Supérieur à</option>
                  <option value="less_than">Inférieur à</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Valeur
                </label>
                <input
                  type="text"
                  value={newRule.trigger?.value}
                  onChange={(e) => setNewRule({
                    ...newRule,
                    trigger: { ...newRule.trigger!, value: e.target.value }
                  })}
                  placeholder="urgent, 10, 14:00..."
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Action à exécuter
                </label>
                <select
                  value={newRule.action?.type}
                  onChange={(e) => setNewRule({
                    ...newRule,
                    action: { ...newRule.action!, type: e.target.value as any }
                  })}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  <option value="transfer">Transférer l'appel</option>
                  <option value="adjust_ai">Ajuster l'IA</option>
                  <option value="send_notification">Envoyer notification</option>
                  <option value="schedule_appointment">Programmer RDV</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Priorité
                </label>
                <select
                  value={newRule.priority}
                  onChange={(e) => setNewRule({ ...newRule, priority: parseInt(e.target.value) })}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  <option value={1}>Haute (1)</option>
                  <option value={2}>Moyenne (2)</option>
                  <option value={3}>Basse (3)</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => {
                  setIsCreating(false);
                  setEditingRule(null);
                }}
              >
                Annuler
              </Button>
              <Button onClick={createRule}>
                {isCreating ? 'Créer' : 'Sauvegarder'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Rules List */}
      <div className="space-y-4">
        {rules.map((rule) => (
          <div key={rule.id} className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4 flex-1">
                <div className="flex items-center space-x-2">
                  <span className="text-2xl">{getTriggerIcon(rule.trigger.type)}</span>
                  <span className="text-2xl">→</span>
                  <span className="text-2xl">{getActionIcon(rule.action.type)}</span>
                </div>
                
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900">{rule.name}</h3>
                  <p className="text-sm text-gray-600">
                    Si {rule.trigger.type} {rule.trigger.condition} "{rule.trigger.value}" 
                    → {rule.action.type}
                  </p>
                  <div className="flex items-center space-x-4 mt-2">
                    <span className="text-xs text-gray-500">
                      Priorité: {rule.priority}
                    </span>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      rule.enabled 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {rule.enabled ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => toggleRule(rule.id, !rule.enabled)}
                >
                  {rule.enabled ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setEditingRule(rule)}
                >
                  <Edit className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => deleteRule(rule.id)}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        ))}

        {rules.length === 0 && (
          <div className="bg-white rounded-xl shadow-sm p-8 border border-gray-100 text-center">
            <Zap className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune Règle d'Automatisation</h3>
            <p className="text-gray-600 mb-4">
              Créez des règles pour automatiser les actions de votre assistant IA
            </p>
            <Button onClick={() => setIsCreating(true)}>
              Créer ma première règle
            </Button>
          </div>
        )}
      </div>

      {/* Predefined Templates */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <h3 className="text-lg font-medium mb-4">Modèles de Règles Prédéfinies</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            {
              name: 'Transfert Urgences',
              description: 'Transfère automatiquement les appels contenant "urgent"',
              trigger: 'urgent, urgence, emergency',
              action: 'Transfert immédiat'
            },
            {
              name: 'Prise de RDV Automatique',
              description: 'Déclenche la prise de RDV pour "rendez-vous"',
              trigger: 'rendez-vous, rdv, appointment',
              action: 'Calendrier automatique'
            },
            {
              name: 'Notification Heures Creuses',
              description: 'Notifie pendant les heures de fermeture',
              trigger: 'Après 18h ou avant 9h',
              action: 'SMS de rappel'
            },
            {
              name: 'Optimisation IA Charge',
              description: 'Ajuste l\'IA selon le volume d\'appels',
              trigger: 'Plus de 10 appels/heure',
              action: 'Réduire température'
            }
          ].map((template, index) => (
            <div key={index} className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 transition-colors">
              <h4 className="font-medium text-gray-900 mb-2">{template.name}</h4>
              <p className="text-sm text-gray-600 mb-3">{template.description}</p>
              <div className="flex justify-between items-center text-xs text-gray-500">
                <span>Déclencheur: {template.trigger}</span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setNewRule({
                      name: template.name,
                      trigger: { type: 'keyword', condition: 'contains', value: template.trigger },
                      action: { type: 'transfer', parameters: {} },
                      enabled: true,
                      priority: 1
                    });
                    setIsCreating(true);
                  }}
                >
                  Utiliser
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}