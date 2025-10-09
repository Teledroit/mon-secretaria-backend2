import { supabase } from './supabase';
import { logger } from './logger';

export async function exportUserData(userId: string) {
  try {
    const userData: Record<string, any> = {};

    const { data: user } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (user) {
      userData.user = user;
    }

    const { data: calls } = await supabase
      .from('calls')
      .select('*')
      .eq('user_id', userId);

    if (calls) {
      userData.calls = calls;
    }

    const { data: appointments } = await supabase
      .from('appointments')
      .select('*')
      .eq('user_id', userId);

    if (appointments) {
      userData.appointments = appointments;
    }

    const { data: notifications } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId);

    if (notifications) {
      userData.notifications = notifications;
    }

    const { data: configurations } = await supabase
      .from('configurations')
      .select('*')
      .eq('user_id', userId);

    if (configurations) {
      userData.configurations = configurations;
    }

    await supabase
      .from('gdpr_requests')
      .insert({
        user_id: userId,
        request_type: 'export',
        status: 'completed',
        completed_at: new Date().toISOString(),
      });

    const dataStr = JSON.stringify(userData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `monsecretaria-data-${userId}-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    logger.info('User data exported successfully', { userId });
    return { success: true };
  } catch (error) {
    logger.error('Error exporting user data', error);
    throw error;
  }
}

export async function deleteUserData(userId: string) {
  try {
    await supabase
      .from('gdpr_requests')
      .insert({
        user_id: userId,
        request_type: 'deletion',
        status: 'pending',
        requested_at: new Date().toISOString(),
      });

    const tablesToDelete = [
      'calls',
      'appointments',
      'notifications',
      'configurations',
      'twilio_phone_numbers',
      'stripe_user_subscriptions',
      'stripe_customers',
    ];

    for (const table of tablesToDelete) {
      await supabase.from(table).delete().eq('user_id', userId);
    }

    await supabase.from('users').delete().eq('id', userId);

    await supabase
      .from('gdpr_requests')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
      })
      .eq('user_id', userId)
      .eq('request_type', 'deletion')
      .eq('status', 'pending');

    logger.info('User data deleted successfully', { userId });
    return { success: true };
  } catch (error) {
    logger.error('Error deleting user data', error);
    throw error;
  }
}

export async function getCookieConsent() {
  try {
    const consent = localStorage.getItem('cookie_consent');
    if (!consent) return null;
    return JSON.parse(consent);
  } catch (error) {
    logger.error('Error getting cookie consent', error);
    return null;
  }
}

export async function updateCookieConsent(consent: {
  necessary: boolean;
  analytics: boolean;
  marketing: boolean;
}) {
  try {
    const consentData = {
      ...consent,
      timestamp: new Date().toISOString(),
    };
    localStorage.setItem('cookie_consent', JSON.stringify(consentData));
    logger.info('Cookie consent updated', consentData);
    return { success: true };
  } catch (error) {
    logger.error('Error updating cookie consent', error);
    throw error;
  }
}
