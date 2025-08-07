import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useStore } from '@/stores/store';
import { notificationService } from '@/services/notificationService';
import { Notification, NotificationType } from '@/types/entities';
import { format } from 'date-fns';
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
import { Bell, Check, CheckCheck, ExternalLink } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

const NotificationDropdown: React.FC = () => {
  const { notifications, unreadCount, markAsRead } = useStore();
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();

  const handleMarkAsRead = async (notification: Notification, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await notificationService.markAsRead(notification.id);
      markAsRead(notification.id);
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
    const { user } = useStore.getState();
    if (!user) return;
    
    try {
      await notificationService.markAllAsRead(user.id);
      // Refresh notifications after marking all as read
      const userNotifications = await notificationService.getNotifications(user.id);
      useStore.getState().setNotifications(userNotifications);
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

  const getNotificationTypeColor = (type: string) => {
    switch (type) {
      case NotificationType.ANNOUNCEMENT:
        return 'bg-blue-100 text-blue-800';
      case NotificationType.MATCH_REMINDER:
        return 'bg-yellow-100 text-yellow-800';
      case NotificationType.SCORE_UPDATE:
        return 'bg-green-100 text-green-800';
      case NotificationType.REGISTRATION_CONFIRMATION:
        return 'bg-purple-100 text-purple-800';
      case NotificationType.WAITLIST_PROMOTION:
        return 'bg-orange-100 text-orange-800';
      case NotificationType.PAYMENT_REMINDER:
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatNotificationType = (type: string) => {
    return type.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
  };

  const recentNotifications = notifications.slice(0, 5);
  const hasUnread = unreadCount > 0;

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          className="relative p-2 rounded-full text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          <span className="sr-only">View notifications</span>
          <Bell className="h-6 w-6" />
          {hasUnread && (
            <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-400 ring-2 ring-white" />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex justify-between items-center">
          <span>Notifications</span>
          {hasUnread && (
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-8 px-2 text-xs" 
              onClick={handleMarkAllAsRead}
            >
              <CheckCheck className="h-3 w-3 mr-1" />
              Mark all as read
            </Button>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {recentNotifications.length > 0 ? (
          <ScrollArea className="h-[300px]">
            {recentNotifications.map((notification) => (
              <DropdownMenuItem key={notification.id} className="flex flex-col items-start p-3 cursor-default">
                <div className="flex justify-between w-full">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{notification.title}</span>
                    <Badge className={`text-xs ${getNotificationTypeColor(notification.type)}`}>
                      {formatNotificationType(notification.type)}
                    </Badge>
                  </div>
                  {!notification.read && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-6 w-6 p-0" 
                      onClick={(e) => handleMarkAsRead(notification, e)}
                    >
                      <Check className="h-3 w-3" />
                    </Button>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-1">{notification.message}</p>
                <div className="flex justify-between w-full mt-2">
                  <span className="text-xs text-muted-foreground">
                    {format(new Date(notification.created_at), 'MMM d, h:mm a')}
                  </span>
                  {!notification.read && (
                    <Badge variant="outline" className="text-xs h-5">New</Badge>
                  )}
                </div>
              </DropdownMenuItem>
            ))}
          </ScrollArea>
        ) : (
          <div className="py-6 text-center">
            <p className="text-sm text-muted-foreground">No notifications</p>
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