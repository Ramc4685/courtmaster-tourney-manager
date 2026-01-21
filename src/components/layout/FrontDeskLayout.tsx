import React from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  Users,
  Megaphone,
  FileText,
  MapPin,
  Home,
  Bell,
  Settings,
  LogOut
} from 'lucide-react';
import { useAuth } from '@/contexts/auth/AuthContext';

interface FrontDeskLayoutProps {
  children: React.ReactNode;
}

export const FrontDeskLayout: React.FC<FrontDeskLayoutProps> = ({ children }) => {
  const navigate = useNavigate();
  const { id: tournamentId } = useParams();
  const location = useLocation();
  const { signOut } = useAuth();

  const navigationItems = [
    {
      label: 'Dashboard',
      icon: Home,
      path: `/frontdesk/${tournamentId}`,
      description: 'Front desk overview'
    },
    {
      label: 'Check-in',
      icon: Users,
      path: `/frontdesk/${tournamentId}/check-in`,
      description: 'Player check-in and registration'
    },
    {
      label: 'Announcements',
      icon: Megaphone,
      path: `/frontdesk/${tournamentId}/announcements`,
      description: 'Manage tournament announcements'
    },
    {
      label: 'Waivers',
      icon: FileText,
      path: `/frontdesk/${tournamentId}/waivers`,
      description: 'Waiver management'
    },
    {
      label: 'Courts',
      icon: MapPin,
      path: `/frontdesk/${tournamentId}/courts`,
      description: 'Court assignment and status'
    }
  ];

  const isActiveRoute = (path: string) => {
    return location.pathname === path;
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div className="w-64 bg-white shadow-lg">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-6 border-b">
            <h1 className="text-xl font-bold text-gray-900">Front Desk</h1>
            <p className="text-sm text-gray-600 mt-1">Tournament Management</p>
          </div>

          {/* Navigation */}
          <div className="flex-1 p-4">
            <nav className="space-y-2">
              {navigationItems.map((item) => {
                const IconComponent = item.icon;
                const isActive = isActiveRoute(item.path);

                return (
                  <Button
                    key={item.path}
                    variant={isActive ? "default" : "ghost"}
                    className={`w-full justify-start ${isActive ? 'bg-primary text-primary-foreground' : 'hover:bg-gray-100'}`}
                    onClick={() => navigate(item.path)}
                  >
                    <IconComponent className="mr-3 h-4 w-4" />
                    <div className="text-left">
                      <div className="font-medium">{item.label}</div>
                    </div>
                  </Button>
                );
              })}
            </nav>
          </div>

          {/* Footer Actions */}
          <div className="p-4 border-t">
            <Button
              variant="ghost"
              className="w-full justify-start mb-2"
              onClick={() => navigate('/tournaments')}
            >
              <Settings className="mr-3 h-4 w-4" />
              Back to Tournaments
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
              onClick={handleSignOut}
            >
              <LogOut className="mr-3 h-4 w-4" />
              Sign Out
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Top Status Bar */}
        <div className="bg-white border-b px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="h-3 w-3 bg-green-500 rounded-full"></div>
              <span className="text-sm text-gray-600">Front Desk Active</span>
            </div>
            <div className="flex items-center space-x-4">
              <Bell className="h-5 w-5 text-gray-400" />
              <span className="text-sm text-gray-600">Tournament ID: {tournamentId}</span>
            </div>
          </div>
        </div>

        {/* Page Content */}
        <div className="flex-1 p-6">
          {children}
        </div>
      </div>
    </div>
  );
};