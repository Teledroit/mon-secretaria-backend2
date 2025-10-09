import { Calendar, PhoneForwarded, MessageCircle } from 'lucide-react';
import Button from '../../ui/Button';

export default function CallsTab() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-4 bg-white rounded-lg border border-gray-200">
          <div className="flex items-center space-x-3 mb-4">
            <Calendar className="w-5 h-5 text-blue-600" />
            <h3 className="font-medium">Intégration Calendly</h3>
          </div>
          <input 
            type="text"
            placeholder="Votre URL Calendly"
            className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>

        <div className="p-4 bg-white rounded-lg border border-gray-200">
          <div className="flex items-center space-x-3 mb-4">
            <PhoneForwarded className="w-5 h-5 text-blue-600" />
            <h3 className="font-medium">Transfert d'Appel</h3>
          </div>
          <input 
            type="tel"
            placeholder="Numéro de téléphone"
            className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="p-4 bg-white rounded-lg border border-gray-200">
        <div className="flex items-center space-x-3 mb-4">
          <MessageCircle className="w-5 h-5 text-blue-600" />
          <h3 className="font-medium">Critères de Transfert</h3>
        </div>
        <div className="space-y-3">
          <label className="flex items-center space-x-2">
            <input type="checkbox" defaultChecked className="rounded text-blue-600" />
            <span className="text-sm">Urgence mentionnée</span>
          </label>
          <label className="flex items-center space-x-2">
            <input type="checkbox" defaultChecked className="rounded text-blue-600" />
            <span className="text-sm">Client existant</span>
          </label>
          <label className="flex items-center space-x-2">
            <input type="checkbox" className="rounded text-blue-600" />
            <span className="text-sm">Montant supérieur à un seuil</span>
          </label>
        </div>
      </div>

      <Button variant="outline" className="w-full">
        Tester la Configuration
      </Button>
    </div>
  );
}