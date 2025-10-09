import { supabase } from '../supabase';

export interface NotificationData {
  clientName?: string;
  phoneNumber?: string;
  date?: string;
  time?: string;
  subject?: string;
  importance?: 'low' | 'medium' | 'high';
  details?: string;
}

export interface NotificationResult {
  success: boolean;
  type: string;
  message: string;
  results: {
    sms: { success: boolean; messageSid?: string; error?: string } | null;
    email: { success: boolean; error?: string } | null;
  };
  sentSMS: boolean;
  sentEmail: boolean;
}

export class NotificationIntegration {
  private static instance: NotificationIntegration;

  static getInstance(): NotificationIntegration {
    if (!NotificationIntegration.instance) {
      NotificationIntegration.instance = new NotificationIntegration();
    }
    return NotificationIntegration.instance;
  }

  async triggerNotification(
    type: 'appointment_booked' | 'urgent_call' | 'important_request',
    data: NotificationData
  ): Promise<NotificationResult> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('User not authenticated');
      }

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/trigger-notification`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
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

      return await response.json();

    } catch (error) {
      console.error('Error triggering notification:', error);
      throw error;
    }
  }

  async sendSMS(phoneNumber: string, message: string): Promise<any> {
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

      return await response.json();

    } catch (error) {
      console.error('Error sending SMS:', error);
      throw error;
    }
  }

  async sendEmail(to: string, subject: string, html: string): Promise<void> {
    try {
      const { data: { session } } = await supabase.auth.getSession();

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({
          to,
          subject,
          html
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to send email');
      }

    } catch (error) {
      console.error('Error sending email:', error);
      throw error;
    }
  }

  // Convenience methods for specific notification types
  async notifyAppointmentBooked(clientName: string, date: string, time: string): Promise<NotificationResult> {
    return this.triggerNotification('appointment_booked', {
      clientName,
      date,
      time
    });
  }

  async notifyUrgentCall(clientName: string, phoneNumber: string): Promise<NotificationResult> {
    return this.triggerNotification('urgent_call', {
      clientName,
      phoneNumber
    });
  }

  async notifyImportantRequest(
    clientName: string, 
    subject: string, 
    importance: 'low' | 'medium' | 'high' = 'high'
  ): Promise<NotificationResult> {
    return this.triggerNotification('important_request', {
      clientName,
      subject,
      importance
    });
  }
}

export const notificationIntegration = NotificationIntegration.getInstance();