
import { supabase } from '@/lib/supabase';
import { Notification } from '@/types/entities';

export class NotificationService {
  async getNotifications(userId: string): Promise<Notification[]> {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
      
    if (error) throw error;
    return data.map(notification => ({
      id: notification.id,
      user_id: notification.user_id,
      title: notification.title,
      message: notification.message,
      type: notification.type,
      read: notification.read,
      created_at: notification.created_at,
      updated_at: notification.updated_at
    })) as Notification[];
  }
  
  async createNotification(notification: Omit<Notification, 'id' | 'created_at'>): Promise<Notification> {
    const { data, error } = await supabase
      .from('notifications')
      .insert({
        user_id: notification.user_id,
        title: notification.title,
        message: notification.message,
        type: notification.type,
        read: notification.read,
        updated_at: notification.updated_at,
        created_at: new Date().toISOString()
      })
      .select()
      .single();
      
    if (error) throw error;
    return data as Notification;
  }
  
  async markAsRead(notificationId: string): Promise<void> {
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', notificationId);
      
    if (error) throw error;
  }
  
  async markAllAsRead(userId: string): Promise<void> {
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', userId);
      
    if (error) throw error;
  }
  
  async deleteNotification(notificationId: string): Promise<void> {
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', notificationId);
      
    if (error) throw error;
  }
}

export const notificationService = new NotificationService();
