import { supabase } from '../supabase';

export interface CalendarEvent {
  id?: string;
  summary: string;
  description?: string;
  start: Date;
  end: Date;
  attendees?: { email: string }[];
}

export interface AvailabilitySlot {
  start: Date;
  end: Date;
  available: boolean;
}

export class CalendarIntegration {
  private static instance: CalendarIntegration;

  static getInstance(): CalendarIntegration {
    if (!CalendarIntegration.instance) {
      CalendarIntegration.instance = new CalendarIntegration();
    }
    return CalendarIntegration.instance;
  }

  async createEvent(event: CalendarEvent): Promise<string> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        throw new Error('User not authenticated');
      }

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/google-calendar-sync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          action: 'create',
          eventData: {
            summary: event.summary,
            description: event.description,
            start: event.start.toISOString(),
            end: event.end.toISOString(),
            attendees: event.attendees
          }
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create calendar event');
      }

      const { eventId } = await response.json();
      return eventId;

    } catch (error) {
      console.error('Error creating calendar event:', error);
      throw error;
    }
  }

  async updateEvent(eventId: string, event: CalendarEvent): Promise<void> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        throw new Error('User not authenticated');
      }

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/google-calendar-sync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          action: 'update',
          appointmentId: eventId,
          eventData: {
            summary: event.summary,
            description: event.description,
            start: event.start.toISOString(),
            end: event.end.toISOString(),
            attendees: event.attendees
          }
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update calendar event');
      }

    } catch (error) {
      console.error('Error updating calendar event:', error);
      throw error;
    }
  }

  async deleteEvent(eventId: string): Promise<void> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        throw new Error('User not authenticated');
      }

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/google-calendar-sync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          action: 'delete',
          appointmentId: eventId
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete calendar event');
      }

    } catch (error) {
      console.error('Error deleting calendar event:', error);
      throw error;
    }
  }

  async checkAvailability(start: Date, end: Date): Promise<boolean> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        throw new Error('User not authenticated');
      }

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/google-calendar-sync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          action: 'check_availability',
          timeSlot: {
            start: start.toISOString(),
            end: end.toISOString()
          }
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to check availability');
      }

      const { available } = await response.json();
      return available;

    } catch (error) {
      console.error('Error checking availability:', error);
      throw error;
    }
  }

  async getAvailableSlots(date: Date, duration: number = 60): Promise<AvailabilitySlot[]> {
    try {
      const startOfDay = new Date(date);
      startOfDay.setHours(9, 0, 0, 0); // 9 AM
      
      const endOfDay = new Date(date);
      endOfDay.setHours(18, 0, 0, 0); // 6 PM

      const slots: AvailabilitySlot[] = [];
      const slotDuration = duration * 60 * 1000; // Convert to milliseconds

      for (let time = startOfDay.getTime(); time < endOfDay.getTime(); time += slotDuration) {
        const slotStart = new Date(time);
        const slotEnd = new Date(time + slotDuration);
        
        const available = await this.checkAvailability(slotStart, slotEnd);
        
        slots.push({
          start: slotStart,
          end: slotEnd,
          available
        });
      }

      return slots;

    } catch (error) {
      console.error('Error getting available slots:', error);
      throw error;
    }
  }
}

export const calendarIntegration = CalendarIntegration.getInstance();