import { NavLink } from 'react-router-dom';
import { useAuth } from '@/contexts/auth/AuthContext';
import {
  LayoutDashboard,
  Trophy,
  Users,
  Calendar,
  Settings,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface NavItem {
  name: string;
  to: string;
  icon: LucideIcon;
  roles?: string[];
}

const navigation: NavItem[] = [
  { name: 'Dashboard', to: '/dashboard', icon: LayoutDashboard },
  { name: 'Tournaments', to: '/tournaments', icon: Trophy },
  { name: 'Players', to: '/players', icon: Users, roles: ['admin', 'organizer'] },
  { name: 'Schedule', to: '/schedule', icon: Calendar },
  { name: 'Settings', to: '/settings', icon: Settings },
];

export default function Sidebar() {
  const { user } = useAuth();

  const filteredNavigation = navigation.filter(
    (item) => !item.roles || item.roles.includes(user?.role || '')
  );

  return (
    <div className="hidden md:flex md:flex-shrink-0">
      <div className="flex flex-col w-64">
        <div className="flex flex-col flex-grow pt-5 pb-4 overflow-y-auto bg-white border-r">
          <div className="flex flex-col flex-grow">
            <nav className="flex-1 px-2 space-y-1">
              {filteredNavigation.map((item) => (
                <NavLink
                  key={item.name}
                  to={item.to}
                  className={({ isActive }) =>
                    `group flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                      isActive
                        ? 'bg-indigo-50 text-indigo-600'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`
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
          </div>
        </div>
      </div>
    </div>
  );
} 