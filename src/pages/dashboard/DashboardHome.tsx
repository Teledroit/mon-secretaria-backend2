import { useState, useEffect } from 'react';
import { Phone, Calendar, Clock, AlertCircle, TrendingUp, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';

interface DashboardStats {
  totalCalls: number;
  appointmentsBooked: number;
  averageCallDuration: string;
  conversionRate: string;
}

interface RecentCall {
  id: string;
  name: string;
  time: string;
  duration: string;
  status: 'completed' | 'missed';
  type: string;
}

interface Appointment {
  id: string;
  name: string;
  time: string;
  type: string;
  duration: string;
}

export default function DashboardHome() {
  const [stats, setStats] = useState<DashboardStats>({
    totalCalls: 0,
    appointmentsBooked: 0,
    averageCallDuration: '0m 0s',
    conversionRate: '0%',
  });
  const [recentCalls, setRecentCalls] = useState<RecentCall[]>([]);
  const [upcomingAppointments] = useState<Appointment[]>([
    {
      id: '1',
      name: 'Marie Dupont',
      time: '2024-03-20 à 14:30',
      type: 'Consultation initiale',
      duration: '45min'
    },
    {
      id: '2',
      name: 'Jean Martin',
      time: '2024-03-21 à 10:00',
      type: 'Suivi dossier',
      duration: '30min',
      status: 'canceled'
    }
  ]);

  useEffect(() => {
    fetchDashboardData();
    subscribeToUpdates();
    
    // Refresh data every 30 seconds
    const interval = setInterval(fetchDashboardData, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchDashboardData = async () => {
    // Récupérer les statistiques des appels
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const { data: todayCalls, error: callsError } = await supabase
      .from('calls')
      .select('*')
      .gte('start_time', today.toISOString());

    if (callsError) {
      console.error('Error fetching calls:', callsError);
      return;
    }

    // Calculer les statistiques
    const totalCalls = todayCalls?.length || 0;
    const completedCalls = todayCalls?.filter(call => call.status === 'completed') || [];
    let totalDuration = 0;
    let averageDuration = 0;
    let minutes = 0;
    let seconds = 0;

    if (completedCalls.length > 0) {
      totalDuration = completedCalls.reduce((acc, call) => {
        if (call.end_time && call.start_time) {
          return acc + (new Date(call.end_time).getTime() - new Date(call.start_time).getTime());
        }
        return acc;
      }, 0);
      averageDuration = totalDuration / completedCalls.length;
      minutes = Math.floor(averageDuration / 60000);
      seconds = Math.floor((averageDuration % 60000) / 1000);
    }

    // Récupérer les appels récents
    const { data: recent, error: recentError } = await supabase
      .from('calls')
      .select(`
        id,
        start_time,
        end_time,
        status,
        transcriptions (
          content
        )
      `)
      .order('start_time', { ascending: false })
      .limit(4);

    if (recentError) {
      console.error('Error fetching recent calls:', recentError);
    } else {
      const formattedCalls = recent?.map(call => ({
        id: call.id,
        name: 'Client', // À remplacer par le vrai nom si disponible
        time: new Date(call.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        duration: call.end_time ? 
          `${Math.floor((new Date(call.end_time).getTime() - new Date(call.start_time).getTime()) / 60000)}:${
            String(Math.floor((new Date(call.end_time).getTime() - new Date(call.start_time).getTime()) / 1000) % 60).padStart(2, '0')
          }` : '--:--',
        status: call.status as 'completed' | 'missed',
        type: call.transcriptions?.[0]?.content?.substring(0, 20) + '...' || 'Appel'
      }));
      setRecentCalls(formattedCalls || []);
    }

    setStats({
      totalCalls,
      appointmentsBooked: await getAppointmentsCount(),
      averageCallDuration: `${minutes}m ${seconds}s`,
      conversionRate: totalCalls > 0 ? `${Math.round((completedCalls.length / totalCalls) * 100)}%` : '0%'
    });
  };

  const getAppointmentsCount = async () => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const { data, error } = await supabase
        .from('appointments')
        .select('count', { count: 'exact' })
        .gte('created_at', today.toISOString())
        .eq('status', 'scheduled');

      if (error) throw error;
      return data?.length || 0;
    } catch (error) {
      console.error('Error fetching appointments count:', error);
      return 0;
    }
  };

  const subscribeToUpdates = () => {
    const subscription = supabase
      .channel('dashboard')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'calls'
      }, () => {
        fetchDashboardData();
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-gray-900">Tableau de bord</h1>
        <Link 
          to="/dashboard/calls"
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Centre d'appels
        </Link>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex justify-between items-start">
            <div className="p-2 bg-blue-50 rounded-lg">
              <Phone className="w-6 h-6 text-blue-600" />
            </div>
            <span className="text-sm font-medium text-green-600">
              +12%
            </span>
          </div>
          <div className="mt-4">
            <h3 className="text-sm font-medium text-gray-500">Appels aujourd'hui</h3>
            <p className="text-2xl font-semibold mt-1">{stats.totalCalls}</p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex justify-between items-start">
            <div className="p-2 bg-blue-50 rounded-lg">
              <Calendar className="w-6 h-6 text-blue-600" />
            </div>
            <span className="text-sm font-medium text-green-600">
              +5%
            </span>
          </div>
          <div className="mt-4">
            <h3 className="text-sm font-medium text-gray-500">Rendez-vous pris</h3>
            <p className="text-2xl font-semibold mt-1">{stats.appointmentsBooked}</p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex justify-between items-start">
            <div className="p-2 bg-blue-50 rounded-lg">
              <Clock className="w-6 h-6 text-blue-600" />
            </div>
            <span className="text-sm font-medium text-red-600">
              -8%
            </span>
          </div>
          <div className="mt-4">
            <h3 className="text-sm font-medium text-gray-500">Temps moyen d'appel</h3>
            <p className="text-2xl font-semibold mt-1">{stats.averageCallDuration}</p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex justify-between items-start">
            <div className="p-2 bg-blue-50 rounded-lg">
              <TrendingUp className="w-6 h-6 text-blue-600" />
            </div>
            <span className="text-sm font-medium text-green-600">
              +15%
            </span>
          </div>
          <div className="mt-4">
            <h3 className="text-sm font-medium text-gray-500">Taux de conversion</h3>
            <p className="text-2xl font-semibold mt-1">{stats.conversionRate}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <h2 className="text-lg font-semibold mb-4">Derniers appels</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-sm text-gray-500">
                    <th className="pb-3">Client</th>
                    <th className="pb-3">Heure</th>
                    <th className="pb-3">Durée</th>
                    <th className="pb-3">Type</th>
                    <th className="pb-3">Statut</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {recentCalls.map((call) => (
                    <tr key={call.id}>
                      <td className="py-3">
                        <div className="flex items-center">
                          <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                            <Users className="w-4 h-4 text-gray-600" />
                          </div>
                          <span className="ml-2 font-medium">{call.name}</span>
                        </div>
                      </td>
                      <td className="py-3">{call.time}</td>
                      <td className="py-3">{call.duration}</td>
                      <td className="py-3">{call.type}</td>
                      <td className="py-3">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          call.status === 'completed' 
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {call.status === 'completed' ? 'Terminé' : 'Manqué'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <h2 className="text-lg font-semibold mb-4">Prochains rendez-vous</h2>
            <div className="bg-blue-50 p-4 rounded-lg mb-4">
              <p className="text-sm text-blue-800">
                <strong>Note :</strong> Les rendez-vous ci-dessous sont des exemples pour illustrer le format d'affichage. Les vrais rendez-vous apparaîtront ici une fois que vous commencerez à recevoir des appels.
              </p>
            </div>
        
            <div className="space-y-4">
              {upcomingAppointments.map((appointment) => (
                <div 
                  key={appointment.id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                >
                  <div>
                    <p className="font-medium">{appointment.name}</p>
                    <p className="text-sm text-gray-500">{appointment.type}</p>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mt-2 ${
                      appointment.status === 'canceled' 
                        ? 'bg-red-100 text-red-800'
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {appointment.status === 'canceled' ? 'Annulé' : 'Confirmé'}
                    </span>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{appointment.time}</p>
                    <p className="text-sm text-gray-500">{appointment.duration}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}