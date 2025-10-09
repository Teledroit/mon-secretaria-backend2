import { getStoredCredentials, handleAuthCallback } from './auth';
import { google } from '@googleapis/calendar';

const CALENDAR_API_BASE = 'https://www.googleapis.com/calendar/v3';
const TIMEZONE = 'Europe/Paris';
const WORKING_HOURS = {
  start: 9, // 9 AM
  end: 18, // 6 PM
  days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']
};

async function fetchWithAuth(endpoint: string, options: RequestInit = {}) {
  const credentials = getStoredCredentials();
  if (!credentials?.access_token) {
    throw new Error('No access token available');
  }

  const response = await fetch(`${CALENDAR_API_BASE}${endpoint}`, {
    ...options,
    headers: {
      ...options.headers,
      'Authorization': `Bearer ${credentials.access_token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Calendar API error: ${response.statusText}`);
  }

  return response.json();
}

export async function listEvents(timeMin: Date, timeMax: Date) {
  const params = new URLSearchParams({
    timeMin: timeMin.toISOString(),
    timeMax: timeMax.toISOString(),
    singleEvents: 'true',
    orderBy: 'startTime'
  });

  return fetchWithAuth(`/calendars/primary/events?${params}`);
}

export async function checkAvailability(start: Date, end: Date): Promise<boolean> {
  // Check if within working hours
  const startHour = start.getHours();
  const endHour = end.getHours();
  const day = start.toLocaleDateString('en-US', { weekday: 'monday' }).toLowerCase();

  if (
    startHour < WORKING_HOURS.start ||
    endHour > WORKING_HOURS.end ||
    !WORKING_HOURS.days.includes(day)
  ) {
    return false;
  }

  // Check for conflicts
  const events = await listEvents(start, end);
  return events.items?.length === 0;
}

export async function createEvent(event: {
  summary: string;
  description?: string;
  start: Date;
  end: Date;
}) {
  return fetchWithAuth('/calendars/primary/events', {
    method: 'POST',
    body: JSON.stringify({
      summary: event.summary,
      description: event.description,
      start: { dateTime: event.start.toISOString() },
      end: { dateTime: event.end.toISOString() }
    })
  });
}

export async function insertEvent(event: {
  summary: string;
  description?: string;
  start: Date;
  end: Date;
  attendees?: { email: string }[];
}) {
  const credentials = getStoredCredentials();
  if (!credentials?.access_token) {
    throw new Error('No access token available');
  }

  const calendar = google.calendar({
    version: 'v3',
    auth: credentials.access_token
  });

  try {
    const response = await calendar.events.insert({
      calendarId: 'primary',
      requestBody: {
        summary: event.summary,
        description: event.description,
        start: {
          dateTime: event.start.toISOString(),
          timeZone: TIMEZONE
        },
        end: {
          dateTime: event.end.toISOString(),
          timeZone: TIMEZONE
        },
        attendees: event.attendees,
        reminders: {
          useDefault: true
        }
      }
    });

    return response.data;
  } catch (error) {
    console.error('Error creating calendar event:', error);
    throw error;
  }
}