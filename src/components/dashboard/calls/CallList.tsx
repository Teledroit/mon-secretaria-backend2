import { useState, useEffect } from 'react';
import { Phone, Clock, TrendingUp, AlertCircle } from 'lucide-react';
import Button from '@/components/ui/Button';
import { supabase } from '@/lib/supabase';

interface Call {
  id: string;
  start_time: string;
  end_time: string | null;
  duration: string | null;
  client_name: string | null;
  phone_number: string;
  status: string;
  cost: number | null;
  transcriptions: {
    content: string;
    sentiment: string | null;
  }[];
}

interface CallListProps {
  calls: Call[];
  onSort: (field: string) => void;
  onViewDetails: (id: string) => void;
}

export default function CallList({ calls, onSort, onViewDetails }: CallListProps) {
  const [isLoading, setIsLoading] = useState(false);

  const getSentimentColor = (sentiment: string | null) => {
    const colors = {
      positive: 'bg-green-100 text-green-800',
      neutral: 'bg-gray-100 text-gray-800',
      negative: 'bg-red-100 text-red-800'
    };
    return colors[sentiment as keyof typeof colors] || colors.neutral;
  };

  const getStatusColor = (status: string) => {
    const colors = {
      completed: 'bg-green-100 text-green-800',
      failed: 'bg-red-100 text-red-800',
      'in-progress': 'bg-blue-100 text-blue-800'
    };
    return colors[status as keyof typeof colors] || colors.neutral;
  };

  const formatDuration = (duration: string | null) => {
    if (!duration) return '--:--';
    const [hours, minutes, seconds] = duration.split(':');
    return `${hours}h ${minutes}m ${Math.floor(parseFloat(seconds))}s`;
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="text-left text-sm text-gray-500 border-b border-gray-100">
              <th className="px-6 py-3 cursor-pointer hover:text-gray-700" onClick={() => onSort('start_time')}>
                Date/Heure
              </th>
              <th className="px-6 py-3 cursor-pointer hover:text-gray-700" onClick={() => onSort('duration')}>
                Durée
              </th>
              <th className="px-6 py-3">Client</th>
              <th className="px-6 py-3 cursor-pointer hover:text-gray-700" onClick={() => onSort('cost')}>
                Coût
              </th>
              <th className="px-6 py-3">Statut</th>
              <th className="px-6 py-3">Sentiment</th>
              <th className="px-6 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {calls.map((call) => (
              <tr key={call.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  {formatDate(call.start_time)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <Clock className="w-4 h-4 text-gray-400 mr-2" />
                    {formatDuration(call.duration)}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex flex-col">
                    <span className="font-medium">{call.client_name || 'Client'}</span>
                    <span className="text-sm text-gray-500">{call.phone_number}</span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <TrendingUp className="w-4 h-4 text-gray-400 mr-2" />
                    {call.cost ? `${call.cost}€` : '--'}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(call.status)}`}>
                    {call.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {call.transcriptions?.[0]?.sentiment && (
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getSentimentColor(call.transcriptions[0].sentiment)}`}>
                      {call.transcriptions[0].sentiment}
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onViewDetails(call.id)}
                  >
                    Détails
                  </Button>
                </td>
              </tr>
            ))}
            {calls.length === 0 && (
              <tr>
                <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                  Aucun appel trouvé
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}