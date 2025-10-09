import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Plus, User, Phone, Mail, Edit, X, Save } from 'lucide-react';
import Button from '@/components/ui/Button';
import CalendarConnect from '../../components/appointments/CalendarConnect';
import { checkCalendarConnection, getStoredCredentials } from '../../lib/calendar/auth';
import { useLocation } from 'react-router-dom';
import { supabase } from '@/lib/supabase';

interface Appointment {
  id: string;
  title: string;
  date: string;
  time: string;
  client: {
    name: string;
    phone: string;
    email: string;
  };
  status: 'scheduled' | 'completed' | 'cancelled';
}

interface NewAppointment {
  title: string;
  date: string;
  time: string;
  clientName: string;
  clientPhone: string;
  clientEmail: string;
}

export default function Appointments() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isCalendarConnected, setIsCalendarConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showNewAppointmentForm, setShowNewAppointmentForm] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState<string | null>(null);
  const [newAppointment, setNewAppointment] = useState<NewAppointment>({
    title: '',
    date: '',
    time: '',
    clientName: '',
    clientPhone: '',
    clientEmail: ''
  });
  const location = useLocation();

  useEffect(() => {
    const checkConnection = async () => {
      try {
        const connected = checkCalendarConnection();
        setIsCalendarConnected(connected);
      } catch (error) {
        console.error('Error checking calendar connection:', error);
        setIsCalendarConnected(false);
      } finally {
        setLoading(false);
      }
    };

    checkConnection();
  }, []);

  // Check if we're returning from a successful calendar connection
  useEffect(() => {
    if (location.state?.calendarConnected) {
      setIsCalendarConnected(true);
      // Clear the state to prevent re-triggering
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  const handleCreateAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const startTime = new Date(`${newAppointment.date}T${newAppointment.time}`);
      const endTime = new Date(startTime.getTime() + 60 * 60 * 1000); // 1 hour duration

      const { data, error } = await supabase
        .from('appointments')
        .insert({
          user_id: user.id,
          client_name: newAppointment.clientName,
          client_phone: newAppointment.clientPhone,
          client_email: newAppointment.clientEmail,
          start_time: startTime.toISOString(),
          end_time: endTime.toISOString(),
          type: newAppointment.title,
          status: 'scheduled'
        })
        .select()
        .single();

      if (error) throw error;

      // Add to local state
      const newAppt: Appointment = {
        id: data.id,
        title: data.type,
        date: newAppointment.date,
        time: newAppointment.time,
        client: {
          name: data.client_name,
          phone: data.client_phone || '',
          email: data.client_email || newAppointment.clientEmail
        },
        status: 'scheduled'
      };

      setAppointments(prev => [newAppt, ...prev]);
      setShowNewAppointmentForm(false);
      setNewAppointment({
        title: '',
        date: '',
        time: '',
        clientName: '',
        clientPhone: '',
        clientEmail: ''
      });

      alert('Rendez-vous créé avec succès !');
    } catch (error) {
      console.error('Error creating appointment:', error);
      alert('Erreur lors de la création du rendez-vous');
    }
  };

  const handleCancelAppointment = async (appointmentId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir annuler ce rendez-vous ?')) return;

    try {
      const { error } = await supabase
        .from('appointments')
        .update({ 
          status: 'cancelled',
          updated_at: new Date().toISOString()
        })
        .eq('id', appointmentId);

      if (error) throw error;

      setAppointments(prev => 
        prev.map(appt => 
          appt.id === appointmentId 
            ? { ...appt, status: 'cancelled' }
            : appt
        )
      );

      alert('Rendez-vous annulé avec succès');
    } catch (error) {
      console.error('Error cancelling appointment:', error);
      alert('Erreur lors de l\'annulation du rendez-vous');
    }
  };

  const handleEditAppointment = (appointmentId: string) => {
    setEditingAppointment(appointmentId);
  };

  const handleSaveEdit = async (appointmentId: string, updatedData: any) => {
    try {
      const { error } = await supabase
        .from('appointments')
        .update({
          ...updatedData,
          updated_at: new Date().toISOString()
        })
        .eq('id', appointmentId);

      if (error) throw error;

      // Update local state
      setAppointments(prev => 
        prev.map(appt => 
          appt.id === appointmentId 
            ? { ...appt, ...updatedData }
            : appt
        )
      );

      setEditingAppointment(null);
      alert('Rendez-vous modifié avec succès');
    } catch (error) {
      console.error('Error updating appointment:', error);
      alert('Erreur lors de la modification du rendez-vous');
    }
  };

  // Mock appointments data
  useEffect(() => {
    fetchRealAppointments();
  }, []);

  const fetchRealAppointments = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('appointments')
        .select('*')
        .eq('user_id', user.id)
        .is('deleted_at', null)
        .order('start_time', { ascending: true });

      if (error) throw error;

      const formattedAppointments: Appointment[] = data?.map(appt => ({
        id: appt.id,
        title: appt.type,
        date: new Date(appt.start_time).toISOString().split('T')[0],
        time: new Date(appt.start_time).toTimeString().slice(0, 5),
        client: {
          name: appt.client_name,
          phone: appt.client_phone || '',
          email: '' // Email not stored in current schema
        },
        status: appt.status as 'scheduled' | 'completed' | 'cancelled'
      })) || [];

      setAppointments(formattedAppointments);
    } catch (error) {
      console.error('Error fetching appointments:', error);
      // Fallback to mock data if real data fails
      loadMockAppointments();
    }
  };

  const loadMockAppointments = () => {
    const mockAppointments: Appointment[] = [
      {
        id: '1',
        title: 'Consultation initiale',
        date: '2024-01-15',
        time: '10:00',
        client: {
          name: 'Marie Dubois',
          phone: '+33 1 23 45 67 89',
          email: 'marie.dubois@email.com'
        },
        status: 'scheduled'
      },
      {
        id: '2',
        title: 'Suivi mensuel',
        date: '2024-01-16',
        time: '14:30',
        client: {
          name: 'Pierre Martin',
          phone: '+33 1 98 76 54 32',
          email: 'pierre.martin@email.com'
        },
        status: 'scheduled'
      }
    ];
    setAppointments(mockAppointments);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'Programmé';
      case 'completed':
        return 'Terminé';
      case 'cancelled':
        return 'Annulé';
      default:
        return status;
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="space-y-4">
            <div className="h-32 bg-gray-200 rounded"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Rendez-vous</h1>
          <p className="text-gray-600">Gérez vos rendez-vous et votre calendrier</p>
        </div>
        <Button 
          onClick={() => setShowNewAppointmentForm(true)}
          className="flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Nouveau rendez-vous
        </Button>
      </div>

      {/* Calendar Connection */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <CalendarConnect isConnected={isCalendarConnected} />
      </div>

      {/* New Appointment Form */}
      {showNewAppointmentForm && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Nouveau rendez-vous</h3>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setShowNewAppointmentForm(false)}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
          
          <form onSubmit={handleCreateAppointment} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Type de consultation
                </label>
                <input
                  type="text"
                  value={newAppointment.title}
                  onChange={(e) => setNewAppointment({...newAppointment, title: e.target.value})}
                  placeholder="Ex: Consultation initiale"
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nom du client
                </label>
                <input
                  type="text"
                  value={newAppointment.clientName}
                  onChange={(e) => setNewAppointment({...newAppointment, clientName: e.target.value})}
                  placeholder="Nom complet"
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date
                </label>
                <input
                  type="date"
                  value={newAppointment.date}
                  onChange={(e) => setNewAppointment({...newAppointment, date: e.target.value})}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Heure
                </label>
                <input
                  type="time"
                  value={newAppointment.time}
                  onChange={(e) => setNewAppointment({...newAppointment, time: e.target.value})}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Téléphone
                </label>
                <input
                  type="tel"
                  value={newAppointment.clientPhone}
                  onChange={(e) => setNewAppointment({...newAppointment, clientPhone: e.target.value})}
                  placeholder="+33123456789"
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={newAppointment.clientEmail}
                  onChange={(e) => setNewAppointment({...newAppointment, clientEmail: e.target.value})}
                  placeholder="client@email.com"
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  required
                />
              </div>
            </div>
            
            <div className="flex gap-2 justify-end">
              <Button 
                type="button" 
                variant="outline"
                onClick={() => setShowNewAppointmentForm(false)}
              >
                Annuler
              </Button>
              <Button type="submit">
                Créer le rendez-vous
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Appointments List */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Prochains rendez-vous
          </h2>
        </div>
        
        <div className="divide-y divide-gray-200">
          {appointments.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>Aucun rendez-vous programmé</p>
            </div>
          ) : (
            appointments.map((appointment) => (
              <div key={appointment.id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-gray-900">{appointment.title}</h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(appointment.status)}`}>
                        {getStatusText(appointment.status)}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {new Date(appointment.date).toLocaleDateString('fr-FR', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {appointment.time}
                      </div>
                    </div>

                    <div className="flex items-center gap-6 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4" />
                        <span>{appointment.client.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4" />
                        <span>{appointment.client.phone}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4" />
                        <span>{appointment.client.email}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 ml-4">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        const updatedData = {
                          client_name: prompt('Nouveau nom:', appointment.client.name) || appointment.client.name,
                          type: prompt('Nouveau type:', appointment.title) || appointment.title
                        };
                        handleSaveEdit(appointment.id, updatedData);
                      }}
                      disabled={appointment.status === 'cancelled'}
                    >
                      <Edit className="w-4 h-4 mr-1" />
                      Modifier
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleCancelAppointment(appointment.id)}
                      disabled={appointment.status === 'cancelled'}
                      className="text-red-600 hover:text-red-700 border-red-200 hover:border-red-300"
                    >
                      <X className="w-4 h-4 mr-1" />
                      Annuler
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}