import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useStore } from '@/stores/store';
import { Notification, NotificationType } from '@/types/entities';
import { format, formatDistanceToNow } from 'date-fns';
import { useToast } from '@/components/ui/use-toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';
import {
  Bell,
  Check,
  CheckCheck,
  ExternalLink,
  Trash2,
  Filter,
  Settings,
  Volume2,
  VolumeX,
  Wifi,
  WifiOff,
  AlertCircle
} from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useRealtimeNotifications } from '../../hooks/useRealtimeNotifications';

interface NotificationDropdownProps {
  tournamentId?: string;
  userId?: string;
  maxNotifications?: number;
  soundEnabled?: boolean;
}

const NotificationDropdown: React.FC<NotificationDropdownProps> = ({
  tournamentId,
  userId,
  maxNotifications = 10,
  soundEnabled = true
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [filterType, setFilterType] = useState<string>('all');
  const [soundMuted, setSoundMuted] = useState(!soundEnabled);
  const [showSettings, setShowSettings] = useState(false);
  const { toast } = useToast();

  // Use our new real-time notifications hook
  const {
    notifications,
    unreadCount,
    loading,
    error,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAll,
    refetch
  } = useRealtimeNotifications({
    tournamentId,
    userId,
    maxNotifications,
    soundEnabled: soundEnabled && !soundMuted
  });

  const handleMarkAsRead = async (notificationId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await markAsRead(notificationId);
      toast({
        title: 'Success',
        description: 'Notification marked as read',
      });
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
      toast({
        title: 'Error',
        description: 'Failed to mark notification as read',
        variant: 'destructive',
      });
    }
  };

  const handleMarkAllAsRead = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await markAllAsRead();
      toast({
        title: 'Success',
        description: 'All notifications marked as read',
      });
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
      toast({
        title: 'Error',
        description: 'Failed to mark all notifications as read',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteNotification = async (notificationId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await deleteNotification(notificationId);
      toast({
        title: 'Success',
        description: 'Notification deleted',
      });
    } catch (error) {
      console.error('Failed to delete notification:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete notification',
        variant: 'destructive',
      });
    }
  };

  const handleClearAll = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to clear all notifications?')) {
      return;
    }

    try {
      await clearAll();
      toast({
        title: 'Success',
        description: 'All notifications cleared',
      });
    } catch (error) {
      console.error('Failed to clear all notifications:', error);
      toast({
        title: 'Error',
        description: 'Failed to clear all notifications',
        variant: 'destructive',
      });
    }
  };

  const getNotificationTypeColor = (type: string, priority?: string) => {
    // Priority-based coloring
    if (priority === 'urgent') return 'bg-red-100 text-red-800 border-red-200';
    if (priority === 'high') return 'bg-orange-100 text-orange-800 border-orange-200';

    // Type-based coloring
    switch (type) {
      case 'announcement':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'match':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'tournament':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'check-in':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'court':
        return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      case 'system':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatNotificationType = (type: string) => {
    return type.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return <AlertCircle className="h-3 w-3 text-red-600" />;
      case 'high':
        return <AlertCircle className="h-3 w-3 text-orange-600" />;
      default:
        return null;
    }
  };

  // Filter notifications based on selected type
  const filteredNotifications = filterType === 'all'
    ? notifications
    : notifications.filter(n => n.type === filterType);

  const recentNotifications = filteredNotifications.slice(0, maxNotifications);
  const hasUnread = unreadCount > 0;

  // Auto-refresh every 30 seconds when dropdown is open
  useEffect(() => {
    if (!isOpen) return;

    const interval = setInterval(() => {
      refetch();
    }, 30000);

    return () => clearInterval(interval);
  }, [isOpen, refetch]);

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative p-2 rounded-full text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          <span className="sr-only">View notifications</span>
          <Bell className={`h-6 w-6 ${hasUnread ? 'animate-pulse' : ''}`} />
          {hasUnread && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
          {error && (
            <span className="absolute top-0 left-0 block h-2 w-2 rounded-full bg-yellow-400 ring-2 ring-white" />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-96">
        <DropdownMenuLabel className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span>Notifications</span>
            {error ? (
              <WifiOff className="h-4 w-4 text-red-500" />
            ) : (
              <Wifi className="h-4 w-4 text-green-500" />
            )}
          </div>
          <div className="flex items-center gap-1">
            {soundEnabled && (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={() => setSoundMuted(!soundMuted)}
              >
                {soundMuted ? (
                  <VolumeX className="h-3 w-3" />
                ) : (
                  <Volume2 className="h-3 w-3" />
                )}
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={() => setShowSettings(!showSettings)}
            >
              <Settings className="h-3 w-3" />
            </Button>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        {/* Controls */}
        <div className="p-2 space-y-2">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-xs"
                onClick={(e) => { e.stopPropagation(); refetch(); }}
                disabled={loading}
              >
                {loading ? <Spinner className="h-3 w-3" /> : 'Refresh'}
              </Button>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="text-xs border rounded px-1 py-1"
              >
                <option value="all">All</option>
                <option value="match">Matches</option>
                <option value="announcement">Announcements</option>
                <option value="tournament">Tournament</option>
                <option value="check-in">Check-ins</option>
                <option value="court">Courts</option>
              </select>
            </div>
            <div className="flex gap-1">
              {hasUnread && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2 text-xs"
                  onClick={handleMarkAllAsRead}
                >
                  <CheckCheck className="h-3 w-3 mr-1" />
                  Read All
                </Button>
              )}
              {notifications.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2 text-xs text-red-600"
                  onClick={handleClearAll}
                >
                  <Trash2 className="h-3 w-3 mr-1" />
                  Clear
                </Button>
              )}
            </div>
          </div>
        </div>
        <DropdownMenuSeparator />
        
        {error && (
          <div className="p-4 text-center">
            <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
            <p className="text-sm text-red-600 mb-2">Connection Error</p>
            <Button size="sm" variant="outline" onClick={refetch}>
              Retry
            </Button>
          </div>
        )}

        {loading && notifications.length === 0 ? (
          <div className="py-6 text-center">
            <Spinner className="h-6 w-6 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Loading notifications...</p>
          </div>
        ) : recentNotifications.length > 0 ? (
          <ScrollArea className="h-[400px]">
            {recentNotifications.map((notification) => (
              <DropdownMenuItem
                key={notification.id}
                className={`flex flex-col items-start p-3 cursor-default transition-colors ${
                  !notification.read ? 'bg-blue-50 border-l-2 border-l-blue-500' : ''
                }`}
              >
                <div className="flex justify-between w-full">
                  <div className="flex items-center gap-2">
                    {getPriorityIcon(notification.priority)}
                    <span className={`font-medium ${!notification.read ? 'text-blue-900' : ''}`}>
                      {notification.title}
                    </span>
                    <Badge
                      className={`text-xs border ${getNotificationTypeColor(notification.type, notification.priority)}`}
                      variant="outline"
                    >
                      {formatNotificationType(notification.type)}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-1">
                    {!notification.read && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={(e) => handleMarkAsRead(notification.id, e)}
                      >
                        <Check className="h-3 w-3" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                      onClick={(e) => handleDeleteNotification(notification.id, e)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                  {notification.message}
                </p>
                <div className="flex justify-between w-full mt-2">
                  <span className="text-xs text-muted-foreground">
                    {formatDistanceToNow(notification.timestamp, { addSuffix: true })}
                  </span>
                  <div className="flex items-center gap-1">
                    {!notification.read && (
                      <Badge variant="default" className="text-xs h-4 px-1">
                        New
                      </Badge>
                    )}
                    {notification.priority === 'urgent' && (
                      <Badge variant="destructive" className="text-xs h-4 px-1">
                        Urgent
                      </Badge>
                    )}
                    {notification.priority === 'high' && (
                      <Badge variant="secondary" className="text-xs h-4 px-1">
                        High
                      </Badge>
                    )}
                  </div>
                </div>
                {notification.actionUrl && (
                  <Link
                    to={notification.actionUrl}
                    className="text-xs text-blue-600 hover:text-blue-800 mt-1"
                    onClick={() => setIsOpen(false)}
                  >
                    View Details →
                  </Link>
                )}
              </DropdownMenuItem>
            ))}
          </ScrollArea>
        ) : (
          <div className="py-8 text-center">
            <Bell className="h-12 w-12 text-gray-300 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground mb-1">No notifications</p>
            <p className="text-xs text-muted-foreground">
              You'll see real-time updates here
            </p>
          </div>
        )}
        
        <DropdownMenuSeparator />
        <Link to="/notifications" onClick={() => setIsOpen(false)}>
          <DropdownMenuItem className="cursor-pointer">
            <span>View all notifications</span>
            <ExternalLink className="h-4 w-4 ml-auto" />
          </DropdownMenuItem>
        </Link>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default NotificationDropdown;