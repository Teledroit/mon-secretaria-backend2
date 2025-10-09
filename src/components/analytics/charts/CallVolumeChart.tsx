import { BarChart3 } from 'lucide-react';

interface CallVolumeChartProps {
  data: Array<{ hour: number; count: number }>;
}

export default function CallVolumeChart({ data }: CallVolumeChartProps) {
  const maxCount = Math.max(...data.map(d => d.count), 1);

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
      <div className="flex items-center gap-2 mb-6">
        <BarChart3 className="w-5 h-5 text-blue-600" />
        <h3 className="text-lg font-medium">Volume d'Appels par Heure</h3>
      </div>

      <div className="space-y-3">
        {data.map((item) => (
          <div key={item.hour} className="flex items-center space-x-4">
            <div className="w-12 text-sm text-gray-600">
              {item.hour.toString().padStart(2, '0')}h
            </div>
            <div className="flex-1 bg-gray-200 rounded-full h-3">
              <div 
                className="bg-blue-600 h-3 rounded-full transition-all duration-300" 
                style={{ width: `${(item.count / maxCount) * 100}%` }}
              />
            </div>
            <div className="w-8 text-sm text-gray-600 text-right">
              {item.count}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <h4 className="font-medium text-blue-900 mb-2">💡 Recommandations</h4>
        <div className="text-sm text-blue-800 space-y-1">
          {data.length > 0 && (
            <>
              <p>• Pic d'activité : {data[0]?.hour}h - {data[0]?.count} appels</p>
              <p>• Optimisez la configuration IA pendant les heures de pointe</p>
              <p>• Considérez un transfert automatique si {'>'} 5 appels/heure</p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}