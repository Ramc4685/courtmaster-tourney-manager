import React, { useState, useEffect } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  CalendarDays,
  Trophy,
  Users,
  Settings,
  Bell,
  WiFiOff,
  Activity,
  Home,
  BarChart3,
  FileText,
  Clock,
  CheckCircle,
  AlertCircle,
  Download
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useMobileOptimization } from '@/hooks/useMobileOptimization';
import { useAuth } from '@/contexts/auth/AuthContext';

interface NavigationItem {
  path: string;
  label: string;
  icon: React.ReactNode;
  badge?: number;
  requiresRole?: string[];
  isActive?: boolean;
}

interface TournamentMobileLayoutProps {
  tournamentId?: string;
  tournamentName?: string;
  userRole?: 'organizer' | 'staff' | 'player' | 'spectator';
  isOffline?: boolean;
  syncStatus?: 'synced' | 'syncing' | 'error';
  pendingChanges?: number;
  onSyncRetry?: () => void;
  onDownloadOfflineData?: () => void;
}

export const TournamentMobileLayout: React.FC<TournamentMobileLayoutProps> = ({
  tournamentId,
  tournamentName = 'Tournament',
  userRole = 'spectator',
  isOffline = false,
  syncStatus = 'synced',
  pendingChanges = 0,
  onSyncRetry,
  onDownloadOfflineData
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const {
    isMobile,
    getRecommendedTouchTargetSize,
    capabilities: { hasReducedMotion }
  } = useMobileOptimization();

  const [notifications, setNotifications] = useState(0);
  const touchTargetSize = getRecommendedTouchTargetSize();

  // Define navigation items based on user role
  const getNavigationItems = (): NavigationItem[] => {
    const baseItems: NavigationItem[] = [
      {
        path: `/tournament/${tournamentId}`,
        label: 'Home',
        icon: <Home className="h-5 w-5" />
      },
      {
        path: `/tournament/${tournamentId}/schedule`,
        label: 'Schedule',
        icon: <CalendarDays className="h-5 w-5" />
      },
      {
        path: `/tournament/${tournamentId}/results`,
        label: 'Results',
        icon: <Trophy className="h-5 w-5" />
      },
      {
        path: `/tournament/${tournamentId}/standings`,
        label: 'Standings',
        icon: <BarChart3 className="h-5 w-5" />
      }
    ];

    // Add role-specific items
    const roleSpecificItems: NavigationItem[] = [];

    if (userRole === 'organizer' || userRole === 'staff') {
      roleSpecificItems.push(
        {
          path: `/tournament/${tournamentId}/manage`,
          label: 'Manage',
          icon: <Settings className="h-5 w-5" />,
          requiresRole: ['organizer', 'staff']
        },
        {
          path: `/tournament/${tournamentId}/teams`,
          label: 'Teams',
          icon: <Users className="h-5 w-5" />,
          requiresRole: ['organizer', 'staff']
        }
      );
    }

    if (userRole === 'player') {
      roleSpecificItems.push({
        path: `/tournament/${tournamentId}/my-matches`,
        label: 'My Matches',
        icon: <Activity className="h-5 w-5" />,
        requiresRole: ['player']
      });
    }

    // Filter items based on role
    const allItems = [...baseItems, ...roleSpecificItems];
    return allItems.filter(item =>
      !item.requiresRole || item.requiresRole.includes(userRole)
    );
  };

  const navigationItems = getNavigationItems();

  // Update active states
  const activeItems = navigationItems.map(item => ({
    ...item,
    isActive: location.pathname === item.path ||
              (item.path !== '/' && location.pathname.startsWith(item.path))
  }));

  // Handle navigation
  const handleNavigate = (path: string) => {
    navigate(path);
  };

  // Mock notification updates
  useEffect(() => {
    // In a real implementation, this would subscribe to notifications
    const interval = setInterval(() => {
      if (Math.random() > 0.8) {
        setNotifications(prev => prev + 1);
      }
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  // Sync status indicator
  const SyncStatusIndicator = () => {
    if (!isOffline && syncStatus === 'synced') return null;

    return (
      <Card className="mx-4 mb-3">
        <CardContent className="p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {isOffline ? (
                <WiFiOff className="h-4 w-4 text-orange-500" />
              ) : syncStatus === 'syncing' ? (
                <div className={cn(
                  "h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full",
                  !hasReducedMotion && "animate-spin"
                )} />
              ) : syncStatus === 'error' ? (
                <AlertCircle className="h-4 w-4 text-red-500" />
              ) : (
                <CheckCircle className="h-4 w-4 text-green-500" />
              )}

              <div className="text-sm">
                {isOffline ? (
                  'Offline Mode'
                ) : syncStatus === 'syncing' ? (
                  'Syncing...'
                ) : syncStatus === 'error' ? (
                  'Sync Error'
                ) : (
                  'Synced'
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              {pendingChanges > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {pendingChanges} pending
                </Badge>
              )}

              {syncStatus === 'error' && onSyncRetry && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onSyncRetry}
                  style={{ minHeight: touchTargetSize * 0.8 }}
                  className="text-xs"
                >
                  Retry
                </Button>
              )}

              {isOffline && onDownloadOfflineData && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onDownloadOfflineData}
                  style={{ minHeight: touchTargetSize * 0.8 }}
                  className="text-xs"
                >
                  <Download className="h-3 w-3" />
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  // Header component
  const Header = () => (
    <div className="bg-background border-b sticky top-0 z-50">
      <div className="flex items-center justify-between p-4">
        <div className="flex-1">
          <h1 className="font-semibold text-lg truncate">{tournamentName}</h1>
          <p className="text-sm text-muted-foreground capitalize">{userRole}</p>
        </div>

        <div className="flex items-center gap-2">
          {/* Notification bell */}
          <div className="relative">
            <Button
              variant="ghost"
              size="sm"
              style={{ minHeight: touchTargetSize, minWidth: touchTargetSize }}
              className="relative"
            >
              <Bell className="h-5 w-5" />
              {notifications > 0 && (
                <Badge
                  variant="destructive"
                  className="absolute -top-1 -right-1 h-5 w-5 p-0 text-xs flex items-center justify-center"
                >
                  {notifications > 9 ? '9+' : notifications}
                </Badge>
              )}
            </Button>
          </div>

          {/* User role badge */}
          <Badge variant="outline" className="text-xs">
            {userRole}
          </Badge>
        </div>
      </div>
    </div>
  );

  // Bottom navigation component
  const BottomNavigation = () => (
    <div className="fixed bottom-0 left-0 right-0 bg-background border-t z-50">
      <div className="grid grid-cols-4 gap-1 p-2">
        {activeItems.slice(0, 4).map((item) => (
          <Button
            key={item.path}
            variant={item.isActive ? "default" : "ghost"}
            size="sm"
            onClick={() => handleNavigate(item.path)}
            style={{ minHeight: touchTargetSize }}
            className={cn(
              "flex flex-col gap-1 h-auto py-2 text-xs",
              item.isActive && "bg-primary text-primary-foreground"
            )}
          >
            {item.icon}
            <span className="truncate max-w-full">{item.label}</span>
            {item.badge && item.badge > 0 && (
              <Badge variant="secondary" className="absolute -top-1 -right-1 h-4 w-4 p-0 text-xs">
                {item.badge}
              </Badge>
            )}
          </Button>
        ))}
      </div>

      {/* Additional navigation items in overflow menu */}
      {activeItems.length > 4 && (
        <div className="border-t p-2">
          <div className="flex gap-2 overflow-x-auto">
            {activeItems.slice(4).map((item) => (
              <Button
                key={item.path}
                variant={item.isActive ? "default" : "outline"}
                size="sm"
                onClick={() => handleNavigate(item.path)}
                style={{ minHeight: touchTargetSize * 0.8 }}
                className="flex items-center gap-2 whitespace-nowrap text-xs"
              >
                {item.icon}
                {item.label}
                {item.badge && item.badge > 0 && (
                  <Badge variant="secondary" className="h-4 w-4 p-0 text-xs">
                    {item.badge}
                  </Badge>
                )}
              </Button>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  if (!isMobile) {
    // For desktop, just render the outlet without mobile layout
    return <Outlet />;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <Header />

      {/* Sync Status */}
      <SyncStatusIndicator />

      {/* Main content */}
      <div className="pb-20"> {/* Space for bottom navigation */}
        <Outlet />
      </div>

      {/* Bottom Navigation */}
      <BottomNavigation />
    </div>
  );
};

export default TournamentMobileLayout;