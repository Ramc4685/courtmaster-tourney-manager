
import { supabase } from '@/lib/supabase';
import { Notification } from '@/types/entities';

export const notificationService = {
  async createNotification(notification: Omit<Notification, 'id' | 'created_at'>): Promise<Notification> {
    const { data, error } = await supabase
      .from('notifications')
      .insert({
        user_id: notification.user_id,
        title: notification.title,
        message: notification.message,
        type: notification.type,
        read: notification.read || false,
        updated_at: notification.updated_at
      })
      .select()
      .single();
      
    if (error) throw error;
    
    return {
      id: data.id,
      user_id: data.user_id,
      title: data.title,
      message: data.message,
      type: data.type,
      read: data.read,
      created_at: data.created_at,
      updated_at: data.updated_at
    };
  },
  
  async getUserNotifications(userId: string): Promise<Notification[]> {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
      
    if (error) throw error;
    
    return data;
  },
  
  async markAsRead(notificationId: string): Promise<void> {
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', notificationId);
      
    if (error) throw error;
  },
  
  async markAllAsRead(userId: string): Promise<void> {
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', userId)
      .eq('read', false);
      
    if (error) throw error;
  }
};
