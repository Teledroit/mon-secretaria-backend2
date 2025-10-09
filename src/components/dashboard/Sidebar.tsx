import { Home, Phone, Calendar, Settings, LogOut, Receipt, Network, Bell } from 'lucide-react';
import { BarChart3 } from 'lucide-react';
import { NavLink, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useAuth } from '@/lib/AuthContext';

interface SidebarProps {
  onClose?: () => void;
}

const navigation = [
  { name: 'Tableau de bord', href: '/dashboard', icon: Home },
  { name: 'Appels', href: '/dashboard/calls', icon: Phone },
  { name: 'Rendez-vous', href: '/dashboard/appointments', icon: Calendar },
  { name: 'Ligne', href: '/dashboard/line', icon: Network },
  { name: 'Analytics', href: '/dashboard/analytics', icon: BarChart3 },
  { name: 'Configuration', href: '/dashboard/settings', icon: Settings },
  { name: 'Notifications', href: '/dashboard/notifications', icon: Bell },
  { name: 'Facturation', href: '/dashboard/billing', icon: Receipt },
];

export default function Sidebar({ onClose }: SidebarProps) {
  const navigate = useNavigate();
  const { signOut } = useAuth();

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  const handleNavClick = () => {
    if (onClose) {
      onClose();
    }
  };

  return (
    <div className="flex h-full w-64 flex-col bg-gray-800">
      <div className="flex h-16 items-center px-4">
        <span className="text-xl font-bold text-white">MonSecretarIA</span>
      </div>
      <nav className="flex-1 space-y-1 px-2 py-4">
        {navigation.map((item) => (
          <NavLink
            key={item.name}
            to={item.href}
            onClick={handleNavClick}
            className={({ isActive }) =>
              cn(
                'group flex items-center px-2 py-2 text-sm font-medium rounded-md',
                isActive
                  ? 'bg-gray-900 text-white'
                  : 'text-gray-300 hover:bg-gray-700 hover:text-white'
              )
            }
          >
            <item.icon
              className="mr-3 h-6 w-6 flex-shrink-0"
              aria-hidden="true"
            />
            {item.name}
          </NavLink>
        ))}
      </nav>
      <div className="flex-shrink-0 flex border-t border-gray-700 p-4">
        <button 
          onClick={handleLogout}
          className="group flex items-center px-2 py-2 text-sm font-medium rounded-md text-gray-300 hover:bg-gray-700 hover:text-white w-full"
        >
          <LogOut className="mr-3 h-6 w-6" />
          Déconnexion
        </button>
      </div>
    </div>
  );
}