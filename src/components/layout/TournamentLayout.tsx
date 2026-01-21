import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Outlet } from 'react-router-dom';
import { useTournamentStore } from '@/stores/tournamentStore';
import { useAuthStore } from '@/stores/authStore';
import { realtimeTournamentService } from '@/services/realtime/RealtimeTournamentService';
import { useRealtimeNotifications } from '@/hooks/useRealtimeNotifications';
import eventBus, { EventType } from '@/events/eventBus';
import { NotificationDropdown } from '@/components/notification/NotificationDropdown';
import { AnnouncementBanner } from '@/components/public/AnnouncementBanner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { tournamentRoutes } from '@/utils/tournamentRoutes';
import { 
  Bell, 
  Users, 
  Trophy, 
  Calendar, 
  MapPin, 
  Settings, 
  Home,
  Activity,
  Wifi,
  WifiOff,
  RefreshCw,
  Menu,
  X
} from 'lucide-react';

interface TournamentLayoutProps {
  children?: React.ReactNode;
}

export function TournamentLayout({ children }: TournamentLayoutProps) {
  const { tournamentId } = useParams<{ tournamentId: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { currentTournament, loading, error, fetchTournament } = useTournamentStore();
  
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [connectionStatus, setConnectionStatus] = useState<{ connected: boolean; online: boolean }>({
    connected: false,
    online: true
  });
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [lastSync, setLastSync] = useState<Date>(new Date());

  // Real-time notifications
  const {
    notifications,
    unreadCount,
    loading: notificationsLoading,
    error: notificationsError
  } = useRealtimeNotifications({
    tournamentId: tournamentId || '',
    userId: user?.id || '',
    enabled: !!tournamentId && !!user?.id
  });

  // Initialize tournament data and real-time connections
  useEffect(() => {
    if (!tournamentId) return;

    // Fetch tournament data
    fetchTournament(tournamentId);

    // Initialize real-time connection
    realtimeTournamentService.initializeConnection(tournamentId);

    // Subscribe to tournament updates
    const unsubscribe = realtimeTournamentService.subscribeTournament(
      tournamentId,
      (update) => {
        if (update.type === 'tournament') {
          console.log('[TournamentLayout] Tournament updated:', update.data);
        }
        setLastSync(new Date());
      }
    );

    return () => {
      unsubscribe();
      realtimeTournamentService.closeConnection(tournamentId);
    };
  }, [tournamentId, fetchTournament]);

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      realtimeTournamentService.setOnlineStatus(true);
    };

    const handleOffline = () => {
      setIsOnline(false);
      realtimeTournamentService.setOnlineStatus(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Update connection status periodically
  useEffect(() => {
    if (!tournamentId) return;

    const updateConnectionStatus = () => {
      const status = realtimeTournamentService.getConnectionStatus(tournamentId);
      setConnectionStatus(status);
    };

    updateConnectionStatus();
    const interval = setInterval(updateConnectionStatus, 5000);

    return () => clearInterval(interval);
  }, [tournamentId]);

  // Handle sync refresh
  const handleRefresh = async () => {
    if (!tournamentId) return;

    try {
      await fetchTournament(tournamentId);
      setLastSync(new Date());
      
      // Emit refresh event
      eventBus.emit(EventType.DATA_REFRESHED, {
        tournamentId,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('[TournamentLayout] Failed to refresh:', error);
    }
  };

  // Navigation items based on user role
  const getNavigationItems = () => {
    const safeRoute = (builder: (id: string) => string) => (tournamentId ? builder(tournamentId) : '#');

    const baseItems = [
      { 
        label: 'Dashboard', 
        path: safeRoute(tournamentRoutes.dashboard), 
        icon: Home,
        roles: ['admin', 'organizer', 'frontdesk']
      },
      { 
        label: 'Live Scoreboard', 
        path: safeRoute(tournamentRoutes.scoreboard), 
        icon: Activity,
        roles: ['admin', 'organizer', 'frontdesk', 'spectator']
      },
      { 
        label: 'Participants', 
        path: safeRoute(tournamentRoutes.participants), 
        icon: Users,
        roles: ['admin', 'organizer', 'frontdesk']
      },
      { 
        label: 'Matches', 
        path: safeRoute(tournamentRoutes.matches), 
        icon: Trophy,
        roles: ['admin', 'organizer', 'frontdesk']
      },
      { 
        label: 'Schedule', 
        path: safeRoute(tournamentRoutes.schedule), 
        icon: Calendar,
        roles: ['admin', 'organizer', 'frontdesk', 'spectator']
      },
      { 
        label: 'Courts', 
        path: safeRoute(tournamentRoutes.courts), 
        icon: MapPin,
        roles: ['admin', 'organizer', 'frontdesk']
      }
    ];

    // Filter based on user role
    const userRole = user?.role || 'spectator';
    return baseItems.filter(item => item.roles.includes(userRole));
  };

  // Format last sync time
  const formatLastSync = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    
    return date.toLocaleDateString();
  };

  if (!tournamentId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="p-6 text-center">
          <h2 className="text-xl font-semibold mb-2">Tournament Not Found</h2>
          <p className="text-muted-foreground mb-4">
            Please select a valid tournament to continue.
          </p>
          <Button onClick={() => navigate('/tournaments')}>
            View Tournaments
          </Button>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading tournament...</p>
        </div>
      </div>
    );
  }

  if (error || !currentTournament) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="p-6 text-center">
          <h2 className="text-xl font-semibold mb-2">Error Loading Tournament</h2>
          <p className="text-muted-foreground mb-4">
            {error || 'Tournament could not be loaded.'}
          </p>
          <div className="space-x-2">
            <Button onClick={handleRefresh}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
            <Button variant="outline" onClick={() => navigate('/tournaments')}>
              Back to Tournaments
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  const navigationItems = getNavigationItems();

  return (
    <div className="min-h-screen bg-background">
      {/* Announcement Banner */}
      <AnnouncementBanner 
        tournamentId={tournamentId}
        className="sticky top-0 z-50"
      />

      {/* Header */}
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            {/* Tournament Info */}
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                className="md:hidden"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              >
                {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </Button>
              
              <div>
                <h1 className="text-lg font-semibold truncate max-w-[200px] md:max-w-none">
                  {currentTournament.name}
                </h1>
                <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                  <Badge variant={currentTournament.status === 'ACTIVE' ? 'default' : 'secondary'}>
                    {currentTournament.status}
                  </Badge>
                  <span>•</span>
                  <span>{currentTournament.format}</span>
                </div>
              </div>
            </div>

            {/* Status and Actions */}
            <div className="flex items-center space-x-2">
              {/* Connection Status */}
              <div className="hidden sm:flex items-center space-x-2 text-sm">
                {isOnline && connectionStatus.connected ? (
                  <div className="flex items-center space-x-1 text-green-600">
                    <Wifi className="h-4 w-4" />
                    <span className="hidden md:inline">Live</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-1 text-orange-600">
                    <WifiOff className="h-4 w-4" />
                    <span className="hidden md:inline">Offline</span>
                  </div>
                )}
                <span className="text-muted-foreground">
                  {formatLastSync(lastSync)}
                </span>
              </div>

              {/* Refresh Button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRefresh}
                disabled={loading}
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              </Button>

              {/* Notifications */}
              <NotificationDropdown />

              {/* Settings (Admin only) */}
              {(user?.role === 'admin' || user?.role === 'organizer') && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    if (tournamentId) {
                      navigate(tournamentRoutes.settings(tournamentId));
                    }
                  }}
                >
                  <Settings className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar Navigation */}
          <aside className={`lg:w-64 ${isMobileMenuOpen ? 'block' : 'hidden lg:block'}`}>
            <Card className="p-4">
              <nav className="space-y-2">
                {navigationItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.path;
                  
                  return (
                    <Button
                      key={item.path}
                      variant={isActive ? 'default' : 'ghost'}
                      className="w-full justify-start"
                      onClick={() => {
                        navigate(item.path);
                        setIsMobileMenuOpen(false);
                      }}
                    >
                      <Icon className="h-4 w-4 mr-2" />
                      {item.label}
                    </Button>
                  );
                })}
              </nav>

              <Separator className="my-4" />

              {/* Tournament Stats */}
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Participants:</span>
                  <span className="font-medium">
                    {currentTournament.registrations?.length || 0}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Matches:</span>
                  <span className="font-medium">
                    {currentTournament.matches?.length || 0}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Courts:</span>
                  <span className="font-medium">
                    {currentTournament.courts?.length || 0}
                  </span>
                </div>
              </div>

              {/* Real-time Stats */}
              {!isOnline && (
                <div className="mt-4 p-2 bg-orange-50 border border-orange-200 rounded text-xs text-orange-700">
                  <WifiOff className="h-3 w-3 inline mr-1" />
                  Working offline. Changes will sync when reconnected.
                </div>
              )}
            </Card>
          </aside>

          {/* Main Content */}
          <main className="flex-1 min-w-0">
            {children || <Outlet />}
          </main>
        </div>
      </div>
    </div>
  );
}

export default TournamentLayout;
