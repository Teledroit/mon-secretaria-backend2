import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';

interface AdminGuardProps {
  children: React.ReactNode;
}

export default function AdminGuard({ children }: AdminGuardProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    checkAdminAccess();
  }, []);

  const checkAdminAccess = async () => {
    try {
      // Vérifier la session admin locale
      const adminSession = localStorage.getItem('admin_session');
      if (!adminSession) {
        setIsAdmin(false);
        setIsLoading(false);
        return;
      }

      // Vérifier la session Supabase
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session || session.user?.email !== 'teledroit@gmail.com') {
        localStorage.removeItem('admin_session');
        setIsAdmin(false);
      } else {
        setIsAdmin(true);
      }
    } catch (error) {
      console.error('Error checking admin access:', error);
      setIsAdmin(false);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (!isAdmin) {
    return <Navigate to="/admin/login" replace />;
  }

  return <>{children}</>;
}