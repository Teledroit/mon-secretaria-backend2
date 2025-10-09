import { useState } from 'react';
import { Phone, Network } from 'lucide-react';
import BuyPhoneNumber from '@/components/dashboard/lines/BuyPhoneNumber';
import ConnectSIP from '@/components/dashboard/lines/ConnectSIP';

type TabType = 'buy' | 'connect';

export default function PhoneLine() {
  const [activeTab, setActiveTab] = useState<TabType>('buy');

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-gray-900">Ligne téléphonique</h1>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="border-b border-gray-100">
          <div className="flex">
            <button
              onClick={() => setActiveTab('buy')}
              className={`px-6 py-4 flex items-center space-x-2 border-b-2 ${
                activeTab === 'buy'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Phone className="w-5 h-5" />
              <span>Acheter un numéro</span>
            </button>
            <button
              onClick={() => setActiveTab('connect')}
              className={`px-6 py-4 flex items-center space-x-2 border-b-2 ${
                activeTab === 'connect'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Network className="w-5 h-5" />
              <span>Connecter via SIP</span>
            </button>
          </div>
        </div>

        <div className="p-6">
          {activeTab === 'buy' ? (
            <BuyPhoneNumber />
          ) : (
            <ConnectSIP />
          )}
        </div>
      </div>
    </div>
  );
}