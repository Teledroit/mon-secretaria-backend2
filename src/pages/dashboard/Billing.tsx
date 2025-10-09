import { useState, useEffect } from 'react';
import BillingHeader from '@/components/billing/BillingHeader';
import UsageSummary from '@/components/billing/UsageSummary';
import { stripeIntegration } from '@/lib/integrations/stripe';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/AuthContext';
import { STRIPE_PRODUCTS } from '@/stripe-config';

interface AIUsageStats {
  minutes: number;
  cost: number;
  averageCostPerMinute: number;
  totalCalls: number;
  activeDays: number;
  averageCallsPerDay: number;
}

export default function Billing() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [isPaused, setIsPaused] = useState(false);
  const [currentPlan, setCurrentPlan] = useState('');
  const [usage, setUsage] = useState<AIUsageStats>({
    minutes: 0,
    cost: 0,
    averageCostPerMinute: 0,
    totalCalls: 0,
    activeDays: 0,
    averageCallsPerDay: 0
  });
  const [currentPeriod, setCurrentPeriod] = useState({
    start: new Date(),
    end: new Date()
  });
  const [customerPortalUrl, setCustomerPortalUrl] = useState('');
  const navigate = useNavigate();
  const { user } = useAuth();
  const [billingHistory, setBillingHistory] = useState<any[]>([]);
  const [isLoadingPortal, setIsLoadingPortal] = useState(false);

  useEffect(() => {
    if (user) {
      Promise.all([
        fetchServiceStatus(),
        fetchSubscriptionDetails(),
        fetchUsageStats()
      ]);
    }
  }, [user]);

  const fetchServiceStatus = async () => {
    try {
      const { data: userData } = await supabase
        .from('users')
        .select('service_paused')
        .single();
      
      setIsPaused(userData?.service_paused || false);
    } catch (error) {
      console.error('Error fetching service status:', error);
    }
  };

  const fetchUsageStats = async () => {
    try {
      const usageData = await stripeIntegration.getUsageStats();

      if (usageData) {
        setUsage({
          minutes: usageData.total_minutes,
          cost: usageData.total_cost,
          averageCostPerMinute: usageData.average_cost_per_minute,
          totalCalls: usageData.total_calls,
          activeDays: usageData.active_days,
          averageCallsPerDay: usageData.average_calls_per_day
        });
      }
    } catch (error) {
      console.error('Error fetching usage stats:', error);
    }
  };

  const fetchSubscriptionDetails = async () => {
    try {
      // Fetch billing history
      const history = await stripeIntegration.getBillingHistory();
      setBillingHistory(history);

      const { data: subscription } = await supabase
        .from('stripe_user_subscriptions')
        .select('price_id')
        .single();

      if (subscription?.price_id) {
        // Find the plan name based on price_id
        const plan = Object.values(STRIPE_PRODUCTS).find(
          p => p.priceId === subscription.price_id
        );
        setCurrentPlan(plan?.name || 'Plan inconnu');
        
        // Set current period
        if (subscription.current_period_start && subscription.current_period_end) {
          setCurrentPeriod({
            start: new Date(subscription.current_period_start * 1000),
            end: new Date(subscription.current_period_end * 1000)
          });
        }
      }

      // Generate customer portal URL
      await generateCustomerPortalUrl();
    } catch (error) {
      console.error('Error fetching subscription details:', error);
    }
  };

  const generateCustomerPortalUrl = async () => {
    try {
      setIsLoadingPortal(true);
      const url = await stripeIntegration.createCustomerPortalSession({
        returnUrl: window.location.href
      });
      setCustomerPortalUrl(url);
    } catch (error) {
      console.error('Error generating customer portal URL:', error);
      // Fallback to static URL
      setCustomerPortalUrl('https://billing.stripe.com/p/login/28E4gzcCl7ww20n1Hq7kc00');
    } finally {
      setIsLoadingPortal(false);
    }
  };

  const handlePauseToggle = async () => {
    try {
      const newState = await stripeIntegration.pauseSubscription();
      setIsPaused(newState);
    } catch (error) {
      console.error('Error toggling service:', error);
      alert('Une erreur est survenue lors de la mise en pause du service');
    }
  };

  const handleCancelSubscription = () => {
    navigate('/subscription/cancel');
  };

  return (
    <div className="space-y-8">
      <BillingHeader 
        currentPlan={currentPlan}
        isOverdue={false}
        isPaused={isPaused}
        customerPortalUrl={isLoadingPortal ? undefined : customerPortalUrl}
        onPauseToggle={handlePauseToggle}
        onCancel={handleCancelSubscription}
      />

      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <h2 className="text-lg font-medium mb-4">Utilisation du mois en cours</h2>
        <UsageSummary
          currentUsage={usage}
          limits={{
            calls: currentPlan === STRIPE_PRODUCTS.STARTER.name ? 49 : Infinity,
            remaining: currentPlan === STRIPE_PRODUCTS.STARTER.name
              ? Math.max(0, 49 - usage.totalCalls)
              : Infinity
          }}
        />
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <h2 className="text-lg font-medium mb-4">Historique de facturation</h2>
        <div className="space-y-3">
          {billingHistory.length > 0 ? (
            billingHistory.map((invoice, index) => (
              <div key={invoice.id || index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium">{invoice.description}</p>
                  <p className="text-sm text-gray-600">{invoice.date}</p>
                </div>
                <div className="text-right">
                  <p className="font-medium">{invoice.amount.toFixed(2)}€</p>
                  <p className="text-sm text-gray-600">{invoice.status}</p>
                  {invoice.invoiceUrl && (
                    <a 
                      href={invoice.invoiceUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-xs text-blue-600 hover:text-blue-800"
                    >
                      Voir la facture
                    </a>
                  )}
                </div>
              </div>
            ))
          ) : (
            <p className="text-center text-gray-500 py-4">
              Aucun historique de facturation disponible
            </p>
          )}
        </div>
      </div>
    </div>
  );
}