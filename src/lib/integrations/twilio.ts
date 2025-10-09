import { supabase } from '../supabase';

export interface PhoneNumber {
  number: string;
  location: string;
  type: 'local' | 'mobile' | 'tollfree';
  price: number;
}

export interface SIPConfiguration {
  phoneNumber: string;
  terminationUri: string;
  username: string;
  password: string;
  nickname?: string;
}

export interface CallData {
  from: string;
  to: string;
  callSid: string;
  duration?: number;
  status: string;
}

export class TwilioIntegration {
  private static instance: TwilioIntegration;

  static getInstance(): TwilioIntegration {
    if (!TwilioIntegration.instance) {
      TwilioIntegration.instance = new TwilioIntegration();
    }
    return TwilioIntegration.instance;
  }

  async searchPhoneNumbers(searchQuery?: string): Promise<PhoneNumber[]> {
    try {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session?.access_token) {
        throw new Error('Utilisateur non authentifié');
      }

      // Clean and format the search query
      let cleanQuery = searchQuery?.trim() || '';

      // Remove +33 and replace with nothing for France searches
      if (cleanQuery.startsWith('+33')) {
        cleanQuery = cleanQuery.substring(3);
      } else if (cleanQuery.startsWith('33')) {
        cleanQuery = cleanQuery.substring(2);
      }

      console.log('Searching for phone numbers with query:', cleanQuery);

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/search-phone-numbers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          searchQuery: cleanQuery,
          country: 'FR'
        })
      });

      const data = await response.json();

      if (!response.ok) {
        const error: any = new Error(data.error || 'Échec de la recherche de numéros');
        error.response = {
          status: response.status,
          data: data
        };
        throw error;
      }

      return data.numbers || [];

    } catch (error) {
      console.error('Error searching phone numbers:', error);
      throw error;
    }
  }

  async purchasePhoneNumber(phoneNumber: string): Promise<void> {
    try {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session?.access_token) {
        throw new Error('Utilisateur non authentifié');
      }

      console.log('Purchasing phone number:', phoneNumber);

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/purchase-phone-number`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ phoneNumber })
      });

      const data = await response.json();

      if (!response.ok) {
        const error: any = new Error(data.error || "Échec de l'achat du numéro");
        error.response = {
          status: response.status,
          data: data
        };
        throw error;
      }

      console.log('Phone number purchased successfully');

    } catch (error) {
      console.error('Error purchasing phone number:', error);
      throw error;
    }
  }

  async configureSIP(config: SIPConfiguration): Promise<void> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        throw new Error('User not authenticated');
      }

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/manage-sip-config`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(config)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to configure SIP');
      }

    } catch (error) {
      console.error('Error configuring SIP:', error);
      throw error;
    }
  }

  async getUserPhoneNumbers(): Promise<any[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase.rpc('get_user_phone_numbers', {
        user_uuid: user.id
      });
      
      if (error) throw error;
      
      return data || [];

    } catch (error) {
      console.error('Error fetching user phone numbers:', error);
      throw error;
    }
  }

  async releasePhoneNumber(numberId: string): Promise<void> {
    try {
      const { error } = await supabase.rpc('release_phone_number', {
        number_id: numberId
      });
      
      if (error) throw error;

    } catch (error) {
      console.error('Error releasing phone number:', error);
      throw error;
    }
  }

  async sendSMS(phoneNumber: string, message: string): Promise<void> {
    try {
      const { data: { session } } = await supabase.auth.getSession();

      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/send-sms`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: phoneNumber,
          message,
          userId: session?.user?.id
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to send SMS');
      }

    } catch (error) {
      console.error('Error sending SMS:', error);
      throw error;
    }
  }

  async logCall(callData: CallData): Promise<string> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('User not authenticated');
      }

      const { data, error } = await supabase
        .from('calls')
        .insert({
          user_id: user.id,
          start_time: new Date().toISOString(),
          phone_number: callData.from,
          status: callData.status
        })
        .select()
        .single();

      if (error) throw error;
      
      return data.id;

    } catch (error) {
      console.error('Error logging call:', error);
      throw error;
    }
  }
}

export const twilioIntegration = TwilioIntegration.getInstance();