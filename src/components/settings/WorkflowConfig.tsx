import { useState } from 'react';
import { GitBranch, Plus, Trash2 } from 'lucide-react';
import Button from '@/components/ui/Button';
import { supabase } from '@/lib/supabase';

interface Step {
  id: string;
  type: 'prompt' | 'condition' | 'action';
  content: string;
  next?: string;
  config?: {
    transferNumber?: string;
    appointmentType?: string;
    urgencyLevel?: 'low' | 'medium' | 'high';
  };
}

interface WorkflowRule {
  id: string;
  name: string;
  trigger: string;
  steps: Step[];
  enabled: boolean;
}

export default function WorkflowConfig() {
  const [steps, setSteps] = useState<Step[]>([]);
  const [selectedType, setSelectedType] = useState<Step['type']>('prompt');
  const [workflows, setWorkflows] = useState<WorkflowRule[]>([]);
  const [currentWorkflow, setCurrentWorkflow] = useState<WorkflowRule | null>(null);
  const [isCreatingWorkflow, setIsCreatingWorkflow] = useState(false);

  const createNewWorkflow = () => {
    const newWorkflow: WorkflowRule = {
      id: Date.now().toString(),
      name: '',
      trigger: '',
      steps: [],
      enabled: true
    };
    setCurrentWorkflow(newWorkflow);
    setSteps([]);
    setIsCreatingWorkflow(true);
  };

  const saveWorkflow = async () => {
    if (!currentWorkflow) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const workflowData = {
        ...currentWorkflow,
        steps,
        user_id: user.id
      };

      // Save to database (you'll need to create a workflows table)
      const { error } = await supabase
        .from('workflows')
        .upsert(workflowData);

      if (error) throw error;

      setWorkflows(prev => {
        const existing = prev.find(w => w.id === currentWorkflow.id);
        if (existing) {
          return prev.map(w => w.id === currentWorkflow.id ? { ...currentWorkflow, steps } : w);
        } else {
          return [...prev, { ...currentWorkflow, steps }];
        }
      });

      setIsCreatingWorkflow(false);
      setCurrentWorkflow(null);
      setSteps([]);
      
      alert('Workflow sauvegardé avec succès !');

    } catch (error) {
      console.error('Error saving workflow:', error);
      alert('Erreur lors de la sauvegarde du workflow');
    }
  };

  const addStep = () => {
    const newStep: Step = {
      id: Date.now().toString(),
      type: selectedType,
      content: '',
    };
    setSteps([...steps, newStep]);
  };

  const updateStep = (id: string, content: string) => {
    setSteps(steps.map(step => 
      step.id === id ? { ...step, content } : step
    ));
  };

  const removeStep = (id: string) => {
    setSteps(steps.filter(step => step.id !== id));
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
      <div className="flex items-center gap-2 mb-6">
        <GitBranch className="w-5 h-5 text-blue-600" />
        <h2 className="text-lg font-medium">Configuration du Workflow</h2>
      </div>

      <div className="space-y-6">
        {!isCreatingWorkflow ? (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-medium">Workflows existants</h3>
              <Button onClick={createNewWorkflow}>
                <Plus className="w-4 h-4 mr-2" />
                Nouveau workflow
              </Button>
            </div>
            
            <div className="space-y-2">
              {workflows.map(workflow => (
                <div key={workflow.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <span className="font-medium">{workflow.name}</span>
                    <p className="text-sm text-gray-600">Déclencheur: {workflow.trigger}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={workflow.enabled}
                        onChange={(e) => {
                          const updated = workflows.map(w => 
                            w.id === workflow.id ? { ...w, enabled: e.target.checked } : w
                          );
                          setWorkflows(updated);
                        }}
                        className="rounded text-blue-600"
                      />
                      <span className="ml-2 text-sm">Actif</span>
                    </label>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setCurrentWorkflow(workflow);
                        setSteps(workflow.steps);
                        setIsCreatingWorkflow(true);
                      }}
                    >
                      Modifier
                    </Button>
                  </div>
                </div>
              ))}
              {workflows.length === 0 && (
                <p className="text-center text-gray-500 py-8">
                  Aucun workflow configuré
                </p>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nom du workflow
                </label>
                <input
                  type="text"
                  value={currentWorkflow?.name || ''}
                  onChange={(e) => setCurrentWorkflow(prev => prev ? { ...prev, name: e.target.value } : null)}
                  placeholder="Ex: Gestion des urgences"
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Déclencheur
                </label>
                <input
                  type="text"
                  value={currentWorkflow?.trigger || ''}
                  onChange={(e) => setCurrentWorkflow(prev => prev ? { ...prev, trigger: e.target.value } : null)}
                  placeholder="Ex: urgent, urgence, emergency"
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
            </div>

        <div className="flex gap-4 items-end">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Type d'étape
            </label>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value as Step['type'])}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="prompt">Prompt</option>
              <option value="condition">Condition</option>
              <option value="action">Action</option>
            </select>
          </div>
          <Button onClick={addStep}>
            <Plus className="w-4 h-4 mr-2" />
            Ajouter une étape
          </Button>
        </div>

        <div className="space-y-4">
          {steps.map((step, index) => (
            <div key={step.id} className="relative border rounded-lg p-4 bg-gray-50">
              <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-blue-600 rounded-full text-white flex items-center justify-center text-sm">
                {index + 1}
              </div>
              <div className="ml-4">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-sm font-medium text-gray-700">
                    {step.type.charAt(0).toUpperCase() + step.type.slice(1)}
                  </span>
                  <button
                    onClick={() => removeStep(step.id)}
                    className="text-gray-400 hover:text-red-600"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <textarea
                  value={step.content}
                  onChange={(e) => updateStep(step.id, e.target.value)}
                  placeholder={
                    step.type === 'prompt' ? "Entrez le prompt..." :
                    step.type === 'condition' ? "Définissez la condition..." :
                    "Décrivez l'action..."
                  }
                  rows={3}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
            </div>
          ))}
        </div>
          </div>
        )}

        {isCreatingWorkflow && (
          <div className="flex justify-end space-x-2">
            <Button
              variant="outline"
              onClick={() => {
                setIsCreatingWorkflow(false);
                setCurrentWorkflow(null);
                setSteps([]);
              }}
            >
              Annuler
            </Button>
            <Button onClick={saveWorkflow}>
              Sauvegarder le workflow
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}