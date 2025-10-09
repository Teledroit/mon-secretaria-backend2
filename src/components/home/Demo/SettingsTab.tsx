import { useState } from 'react';
import { Clock, MessageSquare, FileText, Upload } from 'lucide-react';

export default function SettingsTab() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      setSelectedFile(file);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Détection de Silence
        </label>
        <div className="flex items-center space-x-4">
          <Clock className="w-5 h-5 text-gray-500" />
          <select className="flex-1 rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500">
            <option>10 secondes</option>
            <option>20 secondes</option>
            <option>30 secondes</option>
            <option>45 secondes</option>
            <option>1 minute</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Sensibilité aux Interruptions
        </label>
        <input 
          type="range" 
          min="1" 
          max="10" 
          defaultValue="5"
          className="w-full"
        />
        <div className="flex justify-between text-sm text-gray-500 mt-1">
          <span>Faible</span>
          <span>Élevée</span>
        </div>
      </div>

      <div>
        <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2">
          <FileText className="w-4 h-4" />
          <span>Instructions PDF</span>
        </label>
        <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg">
          <div className="space-y-1 text-center">
            <Upload className="mx-auto h-12 w-12 text-gray-400" />
            <div className="flex text-sm text-gray-600">
              <label className="relative cursor-pointer rounded-md font-medium text-blue-600 hover:text-blue-500">
                <span>Télécharger un fichier</span>
                <input
                  type="file"
                  className="sr-only"
                  accept=".pdf"
                  onChange={handleFileChange}
                />
              </label>
            </div>
            <p className="text-xs text-gray-500">PDF jusqu'à 10MB</p>
          </div>
        </div>
        {selectedFile && (
          <div className="mt-2 text-sm text-gray-600 flex items-center">
            <FileText className="w-4 h-4 mr-2" />
            {selectedFile.name}
          </div>
        )}
        <p className="mt-2 text-sm text-gray-500">
          Ajoutez vos instructions spécifiques pour le traitement des appels clients
        </p>
      </div>

      <div>
        <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2">
          <MessageSquare className="w-4 h-4" />
          <span>Expressions de Confirmation</span>
        </label>
        <div className="space-y-2">
          {['Oui', 'Je comprends', 'D\'accord', 'Bien sûr', 'Je note'].map((phrase) => (
            <label key={phrase} className="flex items-center space-x-2">
              <input type="checkbox" defaultChecked className="rounded text-blue-600" />
              <span className="text-sm text-gray-600">{phrase}</span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}