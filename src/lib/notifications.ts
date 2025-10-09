import { supabase } from './supabase';

export interface NotificationData {
  clientName?: string;
  phoneNumber?: string;
  date?: string;
  time?: string;
  subject?: string;
  importance?: 'low' | 'medium' | 'high';
  details?: string;
}

export async function triggerNotification(
  type: 'appointment_booked' | 'urgent_call' | 'important_request',
  data: NotificationData
) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('User not authenticated');
    }

    const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/trigger-notification`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId: user.id,
        type,
        data
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to trigger notification');
    }

    const result = await response.json();
    return result;

  } catch (error) {
    console.error('Error triggering notification:', error);
    throw error;
  }
}

export async function sendSMS(phoneNumber: string, message: string) {
  try {
    const { data: { user } } = await supabase.auth.getUser();

    const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/send-sms`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: phoneNumber,
        message,
        userId: user?.id
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to send SMS');
    }

    const result = await response.json();
    return result;

  } catch (error) {
    console.error('Error sending SMS:', error);
    throw error;
  }
}

// Example usage functions for different notification types
export async function notifyAppointmentBooked(clientName: string, date: string, time: string) {
  return triggerNotification('appointment_booked', {
    clientName,
    date,
    time
  });
}

export async function notifyUrgentCall(clientName: string, phoneNumber: string) {
  return triggerNotification('urgent_call', {
    clientName,
    phoneNumber
  });
}

export async function notifyImportantRequest(
  clientName: string, 
  subject: string, 
  importance: 'low' | 'medium' | 'high' = 'high'
) {
  return triggerNotification('important_request', {
    clientName,
    subject,
    importance
  });
}