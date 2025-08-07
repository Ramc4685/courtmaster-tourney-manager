import { useEffect, useState } from 'react';
import { useStore } from '@/stores/store';
import { useAuth } from '@/contexts/auth/AuthContext';
import { notificationService } from '@/services/notificationService';
import { subscribeToNotifications } from '@/lib/appwrite';
import { Notification } from '@/types/notification';
import { toast } from 'sonner';

/**
 * Hook to manage notifications, including fetching and real-time updates
 */
export const useNotifications = () => {
  const { user } = useAuth();
  const { notifications, setNotifications, addNotification } = useStore();

  // Fetch notifications on mount and when user changes
  useEffect(() => {
    const fetchNotifications = async () => {
      if (!user) return;
      
      try {
        const userNotifications = await notificationService.getNotifications(user.id);
        setNotifications(userNotifications);
      } catch (error) {
        console.error('Failed to fetch notifications:', error);
      }
    };

    fetchNotifications();
  }, [user, setNotifications]);

  // Subscribe to real-time notifications
  useEffect(() => {
    if (!user) return;

    // Subscribe to real-time notifications using Appwrite
    const unsubscribe = subscribeToNotifications(user.id, (payload: any) => {
      console.log('Notification payload received:', payload);
      
      // Handle notification events from Appwrite
      if (payload.events && payload.payload) {
        const newNotification = payload.payload as Notification;
        addNotification(newNotification);
        
        // Show a toast notification
        toast(newNotification.title, {
          description: newNotification.message,
          position: 'top-right',
          duration: 5000,
          action: {
            label: 'View',
            onClick: () => window.location.href = '/notifications'
          }
        });
      }
    });

    return () => {
      unsubscribe();
    };
  }, [user, addNotification]);

  return { notifications };
};