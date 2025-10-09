import { supabase } from '../supabase';

export interface StripeCustomerPortalOptions {
  returnUrl?: string;
}

export interface BillingHistoryItem {
  id: string;
  date: string;
  description: string;
  amount: number;
  status: string;
  invoiceUrl?: string;
}

export class StripeIntegration {
  private static instance: StripeIntegration;

  static getInstance(): StripeIntegration {
    if (!StripeIntegration.instance) {
      StripeIntegration.instance = new StripeIntegration();
    }
    return StripeIntegration.instance;
  }

  async createCustomerPortalSession(options: StripeCustomerPortalOptions = {}): Promise<string> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        throw new Error('User not authenticated');
      }

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/stripe-customer-portal`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          return_url: options.returnUrl || window.location.href
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create customer portal session');
      }

      const { url } = await response.json();
      return url;

    } catch (error) {
      console.error('Error creating customer portal session:', error);
      throw error;
    }
  }

  async getBillingHistory(): Promise<BillingHistoryItem[]> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        throw new Error('User not authenticated');
      }

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/stripe-billing-history`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        }
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch billing history');
      }

      const { invoices } = await response.json();
      
      return invoices.map((invoice: any) => ({
        id: invoice.id,
        date: new Date(invoice.created * 1000).toLocaleDateString('fr-FR'),
        description: invoice.description || `Facture ${invoice.number}`,
        amount: invoice.amount_paid / 100,
        status: invoice.status,
        invoiceUrl: invoice.hosted_invoice_url
      }));

    } catch (error) {
      console.error('Error fetching billing history:', error);
      throw error;
    }
  }

  async pauseSubscription(): Promise<void> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        throw new Error('User not authenticated');
      }

      // Toggle service pause in database
      const { data, error } = await supabase.rpc('toggle_service_pause');
      
      if (error) throw error;
      
      return data;

    } catch (error) {
      console.error('Error pausing subscription:', error);
      throw error;
    }
  }

  async getUsageStats(): Promise<any> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase.rpc('get_current_usage_stats', {
        user_uuid: user.id
      });
      
      if (error) throw error;
      
      // Parse JSON response from PostgreSQL function
      return typeof data === 'string' ? JSON.parse(data) : data;

    } catch (error) {
      console.error('Error fetching usage stats:', error);
      throw error;
    }
  }
}

export const stripeIntegration = StripeIntegration.getInstance();