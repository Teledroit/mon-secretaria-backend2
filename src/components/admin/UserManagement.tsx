import { useState, useEffect } from 'react';
import { Users, Search, Filter, MoreVertical, Mail, Phone, Building } from 'lucide-react';
import Button from '@/components/ui/Button';
import { supabase } from '@/lib/supabase';

interface User {
  id: string;
  email: string;
  full_name: string;
  company_name: string;
  phone: string;
  created_at: string;
  service_paused: boolean;
  subscription_status?: string;
  total_calls?: number;
  last_login?: string;
}

export default function UserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [users, searchTerm, filterStatus]);

  const fetchUsers = async () => {
    try {
      const { data: usersData, error } = await supabase
        .from('users')
        .select(`
          *,
          stripe_customers (
            customer_id
          ),
          calls (count)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Enrichir avec les données d'abonnement
      const { data: subscriptions } = await supabase
        .from('stripe_user_subscriptions')
        .select('*');

      const enrichedUsers: User[] = usersData?.map(user => ({
        id: user.id,
        email: user.email,
        full_name: user.full_name || 'Non renseigné',
        company_name: user.company_name || 'Non renseigné',
        phone: user.phone || 'Non renseigné',
        created_at: user.created_at,
        service_paused: user.service_paused || false,
        subscription_status: subscriptions?.find(s => 
          s.customer_id === user.stripe_customers?.[0]?.customer_id
        )?.subscription_status,
        total_calls: user.calls?.length || 0
      })) || [];

      setUsers(enrichedUsers);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filterUsers = () => {
    let filtered = users;

    // Filtrer par terme de recherche
    if (searchTerm) {
      filtered = filtered.filter(user =>
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.company_name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filtrer par statut
    if (filterStatus !== 'all') {
      filtered = filtered.filter(user => {
        switch (filterStatus) {
          case 'active':
            return user.subscription_status === 'active';
          case 'trial':
            return user.subscription_status === 'trialing';
          case 'inactive':
            return !user.subscription_status;
          case 'paused':
            return user.service_paused;
          default:
            return true;
        }
      });
    }

    setFilteredUsers(filtered);
  };

  const toggleUserService = async (userId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('users')
        .update({ service_paused: !currentStatus })
        .eq('id', userId);

      if (error) throw error;

      setUsers(prev => prev.map(user => 
        user.id === userId 
          ? { ...user, service_paused: !currentStatus }
          : user
      ));

      alert(`Service ${!currentStatus ? 'suspendu' : 'réactivé'} avec succès`);
    } catch (error) {
      console.error('Error toggling user service:', error);
      alert('Erreur lors de la modification du service');
    }
  };

  const getSubscriptionBadge = (status?: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'trialing':
        return 'bg-blue-100 text-blue-800';
      case 'past_due':
        return 'bg-yellow-100 text-yellow-800';
      case 'canceled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-gray-900">Gestion des Utilisateurs</h1>
        <div className="flex items-center space-x-4">
          <span className="text-sm text-gray-600">
            {filteredUsers.length} utilisateur{filteredUsers.length > 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {/* Filtres et recherche */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher par email, nom ou cabinet..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">Tous les statuts</option>
              <option value="active">Abonnés actifs</option>
              <option value="trial">En essai</option>
              <option value="inactive">Sans abonnement</option>
              <option value="paused">Service suspendu</option>
            </select>
          </div>
        </div>
      </div>

      {/* Liste des utilisateurs */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Utilisateur
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cabinet
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Abonnement
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Appels
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Statut
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <Users className="w-5 h-5 text-blue-600" />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{user.full_name}</div>
                        <div className="text-sm text-gray-500">{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <Building className="w-4 h-4 text-gray-400 mr-2" />
                      <span className="text-sm text-gray-900">{user.company_name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="space-y-1">
                      <div className="flex items-center text-sm text-gray-600">
                        <Mail className="w-4 h-4 mr-2" />
                        {user.email}
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <Phone className="w-4 h-4 mr-2" />
                        {user.phone}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getSubscriptionBadge(user.subscription_status)}`}>
                      {user.subscription_status || 'Aucun'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {user.total_calls || 0}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      user.service_paused 
                        ? 'bg-red-100 text-red-800'
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {user.service_paused ? 'Suspendu' : 'Actif'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      <Button
                        onClick={() => toggleUserService(user.id, user.service_paused)}
                        variant="outline"
                        size="sm"
                        className={user.service_paused ? 'text-green-600' : 'text-red-600'}
                      >
                        {user.service_paused ? 'Réactiver' : 'Suspendre'}
                      </Button>
                      <Button
                        onClick={() => setSelectedUser(user)}
                        variant="outline"
                        size="sm"
                      >
                        Détails
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal détails utilisateur */}
      {selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold">Détails Utilisateur</h2>
                <Button
                  variant="outline"
                  onClick={() => setSelectedUser(null)}
                >
                  Fermer
                </Button>
              </div>
            </div>
            
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-medium text-gray-900 mb-3">Informations Personnelles</h3>
                  <div className="space-y-2 text-sm">
                    <p><strong>Nom :</strong> {selectedUser.full_name}</p>
                    <p><strong>Email :</strong> {selectedUser.email}</p>
                    <p><strong>Téléphone :</strong> {selectedUser.phone}</p>
                    <p><strong>Cabinet :</strong> {selectedUser.company_name}</p>
                    <p><strong>Inscription :</strong> {new Date(selectedUser.created_at).toLocaleDateString('fr-FR')}</p>
                  </div>
                </div>
                
                <div>
                  <h3 className="font-medium text-gray-900 mb-3">Activité</h3>
                  <div className="space-y-2 text-sm">
                    <p><strong>Statut abonnement :</strong> {selectedUser.subscription_status || 'Aucun'}</p>
                    <p><strong>Service :</strong> {selectedUser.service_paused ? 'Suspendu' : 'Actif'}</p>
                    <p><strong>Total appels :</strong> {selectedUser.total_calls || 0}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}