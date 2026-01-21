import { useState, useEffect, useCallback, useRef } from 'react';
import { notificationService } from '../services/notificationService';
import eventBus, { EventType } from '@/events/eventBus';
import { useStore } from '../stores/store';
import { tournamentRoutes } from '@/utils/tournamentRoutes';

// Metadata interfaces for different notification types
export interface MatchMetadata {
  matchId: string;
  court?: string;
  winner?: string;
  scores?: {
    home: number;
    away: number;
  };
}

export interface AnnouncementMetadata {
  announcementId: string;
}

export interface CheckInMetadata {
  registrationId: string;
  type: string;
}

export interface CourtMetadata {
  matchId: string;
  courtId: string;
}

export interface TournamentMetadata {
  updateType: string;
}

// Generic notification data interface
export interface NotificationData<T = unknown> {
  id: string;
  title: string;
  message: string;
  type: 'match' | 'tournament' | 'announcement' | 'system' | 'check-in' | 'court';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  timestamp: Date;
  read: boolean;
  actionUrl?: string;
  metadata?: T;
}

// Specific notification types
export type MatchNotification = NotificationData<MatchMetadata>;
export type AnnouncementNotification = NotificationData<AnnouncementMetadata>;
export type CheckInNotification = NotificationData<CheckInMetadata>;
export type CourtNotification = NotificationData<CourtMetadata>;
export type TournamentNotification = NotificationData<TournamentMetadata>;
export type SystemNotification = NotificationData<Record<string, unknown>>;

// Service response interfaces
export interface TournamentAnnouncementResponse {
  id: string;
  title: string | null;
  message: string | null;
  status: 'ACTIVE' | 'INACTIVE' | 'SCHEDULED';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  createdAt: Date | null;
}

export interface UserNotificationResponse {
  id: string;
  title: string;
  message: string;
  type: string;
  priority: string;
  createdAt: Date;
  read: boolean;
  actionUrl?: string;
  metadata?: Record<string, unknown>;
}

export interface UseRealtimeNotificationsOptions {
  tournamentId?: string;
  userId?: string;
  filterByRole?: string[];
  maxNotifications?: number;
  autoMarkAsRead?: boolean;
  soundEnabled?: boolean;
  enabled?: boolean;
}

export interface UseRealtimeNotificationsReturn {
  notifications: NotificationData[];
  unreadCount: number;
  loading: boolean;
  error: string | null;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (notificationId: string) => Promise<void>;
  clearAll: () => Promise<void>;
  refetch: () => Promise<void>;
}

export function useRealtimeNotifications(
  options: UseRealtimeNotificationsOptions = {}
): UseRealtimeNotificationsReturn {
  const {
    tournamentId,
    userId,
    filterByRole = [],
    maxNotifications = 50,
    autoMarkAsRead = false,
    soundEnabled = true,
    enabled = true
  } = options;

  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState<string | null>(null);

  const mountedRef = useRef(true);
  const lastNotificationTime = useRef<number>(0);
  const store = useStore();

  // Audio context for notification sounds
  const playNotificationSound = useCallback((priority: string) => {
    if (!soundEnabled) return;

    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      // Different sounds for different priorities
      let frequency = 800;
      let duration = 0.2;

      switch (priority) {
        case 'urgent':
          frequency = 1000;
          duration = 0.3;
          break;
        case 'high':
          frequency = 900;
          duration = 0.25;
          break;
        case 'normal':
          frequency = 800;
          duration = 0.2;
          break;
        case 'low':
          frequency = 700;
          duration = 0.15;
          break;
      }

      oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(frequency * 0.8, audioContext.currentTime + duration);

      gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + duration);
    } catch (error) {
      // Ignore audio errors
    }
  }, [soundEnabled]);

  // Transform event data to notification format
  const createNotificationFromEvent = useCallback((eventType: EventType, data: any): NotificationData | null => {
    const timestamp = new Date();
    const id = `${eventType}-${data.id || Date.now()}`;

    switch (eventType) {
      case EventType.MATCH_STARTED:
        return {
          id,
          title: 'Match Started',
          message: `${data.homeTeam} vs ${data.awayTeam} has begun on ${data.court}`,
          type: 'match',
          priority: 'normal',
          timestamp,
          read: false,
          actionUrl: tournamentId ? tournamentRoutes.match(tournamentId, data.matchId) : undefined,
          metadata: { matchId: data.matchId, court: data.court } as MatchMetadata
        } as MatchNotification;

      case EventType.MATCH_COMPLETED:
        return {
          id,
          title: 'Match Completed',
          message: `${data.homeTeam} defeated ${data.awayTeam} ${data.homeScore}-${data.awayScore}`,
          type: 'match',
          priority: 'normal',
          timestamp,
          read: false,
          actionUrl: tournamentId ? tournamentRoutes.match(tournamentId, data.matchId) : undefined,
          metadata: { matchId: data.matchId, winner: data.winner } as MatchMetadata
        } as MatchNotification;

      case EventType.SCORE_UPDATED:
        return {
          id,
          title: 'Score Update',
          message: `${data.homeTeam} ${data.homeScore} - ${data.awayScore} ${data.awayTeam}`,
          type: 'match',
          priority: 'low',
          timestamp,
          read: false,
          actionUrl: tournamentId ? tournamentRoutes.match(tournamentId, data.matchId) : undefined,
          metadata: { matchId: data.matchId, scores: { home: data.homeScore, away: data.awayScore } } as MatchMetadata
        } as MatchNotification;

      case EventType.ANNOUNCEMENT_CREATED:
        return {
          id,
          title: data.title || 'Tournament Announcement',
          message: data.message,
          type: 'announcement',
          priority: data.priority || 'normal',
          timestamp,
          read: false,
          actionUrl: tournamentId ? tournamentRoutes.announcements(tournamentId) : undefined,
          metadata: { announcementId: data.announcementId } as AnnouncementMetadata
        } as AnnouncementNotification;

      case EventType.CHECK_IN_COMPLETED:
        return {
          id,
          title: 'Player Checked In',
          message: `${data.name} has been checked in for the tournament`,
          type: 'check-in',
          priority: 'low',
          timestamp,
          read: false,
          metadata: { registrationId: data.registrationId, type: data.type } as CheckInMetadata
        } as CheckInNotification;

      case EventType.COURT_ASSIGNED:
        return {
          id,
          title: 'Court Assigned',
          message: `Match assigned to ${data.courtName}`,
          type: 'court',
          priority: 'low',
          timestamp,
          read: false,
          metadata: { matchId: data.matchId, courtId: data.courtId } as CourtMetadata
        } as CourtNotification;

      case EventType.TOURNAMENT_UPDATED:
        return {
          id,
          title: 'Tournament Update',
          message: data.message || 'Tournament information has been updated',
          type: 'tournament',
          priority: 'normal',
          timestamp,
          read: false,
          metadata: { updateType: data.type } as TournamentMetadata
        } as TournamentNotification;

      default:
        return null;
    }
  }, [tournamentId]);

  // Add notification to state
  const addNotification = useCallback((notification: NotificationData) => {
    if (!mountedRef.current || !enabled) return;

    // Prevent duplicate notifications within a short time window
    const now = Date.now();
    if (now - lastNotificationTime.current < 1000) return;
    lastNotificationTime.current = now;

    setNotifications(prev => {
      // Check for duplicates
      const isDuplicate = prev.some(n =>
        n.title === notification.title &&
        n.message === notification.message &&
        now - n.timestamp.getTime() < 5000 // 5 seconds
      );

      if (isDuplicate) return prev;

      // Add new notification at the beginning
      const updated = [notification, ...prev];

      // Keep only the most recent notifications
      if (updated.length > maxNotifications) {
        return updated.slice(0, maxNotifications);
      }

      return updated;
    });

    // Play notification sound
    playNotificationSound(notification.priority);

    // Auto-mark as read if enabled and not high priority
    if (autoMarkAsRead && notification.priority !== 'urgent' && notification.priority !== 'high') {
      setTimeout(() => {
        markAsRead(notification.id);
      }, 3000);
    }

    // Update store notification count (convert to store's expected format)
    const storeNotification = {
      id: notification.id,
      user_id: userId || 'anonymous',
      title: notification.title,
      message: notification.message,
      type: notification.type as any,
      read: notification.read,
      created_at: notification.timestamp.toISOString(),
      updated_at: notification.timestamp.toISOString(),
      related_entity_id: notification.metadata && typeof notification.metadata === 'object' && 'matchId' in notification.metadata ? (notification.metadata as any).matchId : undefined,
      related_entity_type: notification.type
    };
    store.addNotification(storeNotification);
  }, [maxNotifications, playNotificationSound, autoMarkAsRead, store, enabled]);

  // Event handlers for different event types
  const eventHandlers = useCallback(() => {
    if (!enabled) {
      return () => {};
    }

    const handlers = [
      EventType.MATCH_STARTED,
      EventType.MATCH_COMPLETED,
      EventType.SCORE_UPDATED,
      EventType.ANNOUNCEMENT_CREATED,
      EventType.CHECK_IN_COMPLETED,
      EventType.COURT_ASSIGNED,
      EventType.COURT_RELEASED,
      EventType.TOURNAMENT_UPDATED
    ];

    const handleEvent = (eventType: EventType) => (data: any) => {
      // Filter by tournament if specified
      if (tournamentId && data.tournamentId && data.tournamentId !== tournamentId) {
        return;
      }

      // Filter by user role if specified
      if (filterByRole.length > 0 && data.userRole && !filterByRole.includes(data.userRole)) {
        return;
      }

      const notification = createNotificationFromEvent(eventType, data);
      if (notification) {
        addNotification(notification);
      }
    };

    // Subscribe to all relevant events
    handlers.forEach(eventType => {
      eventBus.on(eventType, handleEvent(eventType));
    });

    return () => {
      // Cleanup event subscriptions
      handlers.forEach(eventType => {
        eventBus.off(eventType, handleEvent(eventType));
      });
    };
  }, [tournamentId, filterByRole, createNotificationFromEvent, addNotification, enabled]);

  // Fetch initial notifications
  const fetchNotifications = useCallback(async () => {
    if (!mountedRef.current) return;

    if (!enabled) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      let fetchedNotifications: NotificationData[] = [];

      if (tournamentId) {
        // Fetch tournament-specific notifications
        const announcements = await notificationService.getTournamentAnnouncements(tournamentId);

        // Convert announcements to notifications
        fetchedNotifications = announcements
          .filter((announcement: TournamentAnnouncementResponse) => announcement.status === 'ACTIVE')
          .map((announcement: TournamentAnnouncementResponse): AnnouncementNotification => ({
            id: announcement.id,
            title: announcement.title || 'Tournament Announcement',
            message: announcement.message || '',
            type: 'announcement' as const,
            priority: announcement.priority,
            timestamp: announcement.createdAt || new Date(),
            read: false,
            actionUrl: tournamentRoutes.announcements(tournamentId),
            metadata: { announcementId: announcement.id } as AnnouncementMetadata
          }));
      }

      if (userId) {
        // Fetch user-specific notifications (if available)
        try {
          const userNotifications = await notificationService.getNotifications(userId);
          const userNotificationData = userNotifications.map((notification): NotificationData => {
            // Map NotificationType enum to our notification types
            let mappedType: NotificationData['type'] = 'system';
            switch (notification.type) {
              case 'ANNOUNCEMENT':
                mappedType = 'announcement';
                break;
              case 'MATCH_REMINDER':
              case 'SCORE_UPDATE':
                mappedType = 'match';
                break;
              case 'GENERAL':
              default:
                mappedType = 'system';
                break;
            }

            return {
              id: notification.id,
              title: notification.title,
              message: notification.message,
              type: mappedType,
              priority: 'normal' as NotificationData['priority'], // Default priority since service doesn't provide it
              timestamp: new Date(notification.created_at),
              read: notification.read || false,
              actionUrl: undefined, // Service doesn't provide actionUrl
              metadata: {
                relatedEntityId: notification.related_entity_id,
                relatedEntityType: notification.related_entity_type
              }
            };
          });

          fetchedNotifications = [...fetchedNotifications, ...userNotificationData];
        } catch (userError) {
          // User notifications might not be available
          console.warn('User notifications not available:', userError);
        }
      }

      // Sort by timestamp (newest first) and limit
      fetchedNotifications.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
      if (fetchedNotifications.length > maxNotifications) {
        fetchedNotifications = fetchedNotifications.slice(0, maxNotifications);
      }

      if (mountedRef.current) {
        setNotifications(fetchedNotifications);
      }
    } catch (err) {
      console.error('Error fetching notifications:', err);
      if (mountedRef.current) {
        setError('Failed to load notifications');
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, [tournamentId, userId, maxNotifications, enabled]);

  // Mark notification as read
  const markAsRead = useCallback(async (notificationId: string) => {
    setNotifications(prev =>
      prev.map(notification =>
        notification.id === notificationId
          ? { ...notification, read: true }
          : notification
      )
    );

    // Update in backend if applicable
    try {
      await notificationService.markAsRead(notificationId);
    } catch (error) {
      console.warn('Failed to mark notification as read in backend:', error);
    }
  }, [userId]);

  // Mark all notifications as read
  const markAllAsRead = useCallback(async () => {
    setNotifications(prev =>
      prev.map(notification => ({ ...notification, read: true }))
    );

    try {
      if (userId) {
        await notificationService.markAllAsRead(userId);
      }
    } catch (error) {
      console.warn('Failed to mark all notifications as read in backend:', error);
    }
  }, [userId]);

  // Delete specific notification
  const deleteNotification = useCallback(async (notificationId: string) => {
    setNotifications(prev => prev.filter(n => n.id !== notificationId));

    try {
      await notificationService.deleteNotification(notificationId);
    } catch (error) {
      console.warn('Failed to delete notification in backend:', error);
    }
  }, [userId]);

  // Clear all notifications
  const clearAll = useCallback(async () => {
    setNotifications([]);

    try {
      if (userId) {
        // Since there's no clearAllNotifications method, we'll need to delete individually
        const userNotifications = await notificationService.getNotifications(userId);
        await Promise.all(
          userNotifications.map(notification => 
            notificationService.deleteNotification(notification.id)
          )
        );
      }
    } catch (error) {
      console.warn('Failed to clear all notifications in backend:', error);
    }
  }, [userId]);

  // Setup event subscriptions
  useEffect(() => {
    const cleanup = eventHandlers();
    return cleanup;
  }, [eventHandlers]);

  // Initial load
  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Calculate unread count
  const unreadCount = notifications.filter(n => !n.read).length;

  return {
    notifications,
    unreadCount,
    loading,
    error,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAll,
    refetch: fetchNotifications
  };
}
