import { Navigate, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { getSubscriptionStatus } from '@/lib/stripe';
import { logger } from '@/lib/logger';

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);
  const [session, setSession] = useState(null);
  const location = useLocation();

  useEffect(() => {
    const checkAccess = async () => {
      try {
        // Check if user is authenticated
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        setSession(currentSession);
        
        if (!currentSession) {
          setHasAccess(false);
          setIsLoading(false);
          return;
        }

        // Get subscription status with retry logic
        const subscription = await getSubscriptionStatus();
        const validStatuses = ['active', 'trialing', 'past_due', 'not_started'];

        setHasAccess(
          subscription && validStatuses.includes(subscription.subscription_status)
        );
      } catch (error) {
        logger.error('Error checking access in AuthGuard', error);
        setHasAccess(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkAccess();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (!hasAccess) {
    // If user is not authenticated, redirect to login
    if (!session) {
      return <Navigate to="/login" state={{ from: location }} replace />;
    }
    // If authenticated but no subscription, redirect to pricing
    return <Navigate to="/pricing" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}