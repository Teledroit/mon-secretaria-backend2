import { useState } from 'react';
import { Search, Filter } from 'lucide-react';
import Button from '@/components/ui/Button';
import { supabase } from '@/lib/supabase';

interface CallFiltersProps {
  onFilterChange: (filters: Record<string, any>) => void;
}

export default function CallFilters({ onFilterChange }: CallFiltersProps) {
  const [filters, setFilters] = useState({
    date: '',
    status: '',
    sentiment: '',
    duration: '',
    cost: ''
  });

  const handleFilterChange = (field: string, value: string) => {
    const newFilters = { ...filters, [field]: value };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const handleReset = () => {
    const resetFilters = {
      date: '',
      status: '',
      sentiment: '',
      duration: '',
      cost: ''
    };
    setFilters(resetFilters);
    onFilterChange(resetFilters);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-medium">Filtres</h3>
        <Button variant="outline" size="sm" onClick={handleReset}>
          <Filter className="w-4 h-4 mr-2" />
          Réinitialiser
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Date
          </label>
          <input
            type="date"
            value={filters.date}
            onChange={(e) => handleFilterChange('date', e.target.value)}
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Statut
          </label>
          <select
            value={filters.status}
            onChange={(e) => handleFilterChange('status', e.target.value)}
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          >
            <option value="">Tous</option>
            <option value="completed">Terminé</option>
            <option value="in-progress">En cours</option>
            <option value="failed">Échoué</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Sentiment
          </label>
          <select
            value={filters.sentiment}
            onChange={(e) => handleFilterChange('sentiment', e.target.value)}
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          >
            <option value="">Tous</option>
            <option value="positive">Positif</option>
            <option value="neutral">Neutre</option>
            <option value="negative">Négatif</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Durée minimale (minutes)
          </label>
          <input
            type="number"
            min="0"
            value={filters.duration}
            onChange={(e) => handleFilterChange('duration', e.target.value)}
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Coût minimal (€)
          </label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={filters.cost}
            onChange={(e) => handleFilterChange('cost', e.target.value)}
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>
      </div>
    </div>
  );
}