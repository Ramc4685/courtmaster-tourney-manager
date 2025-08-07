import React, { useEffect, useState } from 'react';
import { useStore } from '@/stores/store';
import { notificationService } from '@/services/notificationService';
import { useAuth } from '@/contexts/auth/AuthContext';
import { Notification } from '@/types/entities';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Bell, Check, Trash2, CheckCheck } from 'lucide-react';
import { format } from 'date-fns';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/components/ui/use-toast';
import PageHeader from '@/components/shared/PageHeader';

const NotificationsPage: React.FC = () => {
  const { user } = useAuth();
  const { notifications, setNotifications, markAsRead } = useStore();
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const { toast } = useToast();

  const fetchNotifications = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const userNotifications = await notificationService.getNotifications(user.id);
      setNotifications(userNotifications);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
      toast({
        title: 'Error',
        description: 'Failed to load notifications. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [user]);

  const handleMarkAsRead = async (notification: Notification) => {
    try {
      await notificationService.markAsRead(notification.id);
      markAsRead(notification.id);
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

  const handleMarkAllAsRead = async () => {
    if (!user) return;
    
    try {
      await notificationService.markAllAsRead(user.id);
      // Refresh notifications after marking all as read
      fetchNotifications();
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

  const handleDeleteNotification = async (id: string) => {
    try {
      await notificationService.deleteNotification(id);
      // Refresh notifications after deletion
      fetchNotifications();
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

  const filteredNotifications = notifications.filter(notification => {
    if (activeTab === 'all') return true;
    if (activeTab === 'unread') return !notification.read;
    if (activeTab === 'read') return notification.read;
    return true;
  });

  const getNotificationTypeColor = (type: string) => {
    switch (type) {
      case 'ANNOUNCEMENT':
        return 'bg-blue-100 text-blue-800';
      case 'MATCH_REMINDER':
        return 'bg-yellow-100 text-yellow-800';
      case 'SCORE_UPDATE':
        return 'bg-green-100 text-green-800';
      case 'REGISTRATION_CONFIRMATION':
        return 'bg-purple-100 text-purple-800';
      case 'WAITLIST_PROMOTION':
        return 'bg-orange-100 text-orange-800';
      case 'PAYMENT_REMINDER':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatNotificationType = (type: string) => {
    return type.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
  };

  return (
    <div className="container py-6">
      <PageHeader
        title="Notifications"
        description="View and manage your notifications"
        action={
          <Button 
            variant="outline" 
            onClick={handleMarkAllAsRead}
            disabled={isLoading || notifications.filter(n => !n.read).length === 0}
          >
            <CheckCheck className="h-4 w-4 mr-2" />
            Mark All as Read
          </Button>
        }
      />

      <Card className="mt-6">
        <CardHeader>
          <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="unread">
                Unread
                {notifications.filter(n => !n.read).length > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    {notifications.filter(n => !n.read).length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="read">Read</TabsTrigger>
            </TabsList>
          </Tabs>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : filteredNotifications.length > 0 ? (
            <ScrollArea className="h-[500px] pr-4">
              <div className="space-y-4">
                {filteredNotifications.map((notification) => (
                  <div 
                    key={notification.id} 
                    className={`p-4 rounded-lg border ${!notification.read ? 'bg-muted/50' : ''}`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-medium">{notification.title}</h3>
                          <Badge className={getNotificationTypeColor(notification.type)}>
                            {formatNotificationType(notification.type)}
                          </Badge>
                          {!notification.read && (
                            <Badge variant="outline" className="text-xs">New</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          {notification.message}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(notification.created_at), 'PPp')}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        {!notification.read && (
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            onClick={() => handleMarkAsRead(notification)}
                            title="Mark as read"
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                        )}
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          onClick={() => handleDeleteNotification(notification.id)}
                          title="Delete notification"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          ) : (
            <div className="flex flex-col items-center justify-center py-12">
              <Bell className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-1">
                {activeTab === 'all' 
                  ? 'No notifications' 
                  : activeTab === 'unread' 
                    ? 'No unread notifications' 
                    : 'No read notifications'}
              </h3>
              <p className="text-sm text-muted-foreground">
                {activeTab === 'all' 
                  ? 'You don\'t have any notifications yet.' 
                  : activeTab === 'unread' 
                    ? 'You\'ve read all your notifications.' 
                    : 'You haven\'t read any notifications yet.'}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default NotificationsPage;