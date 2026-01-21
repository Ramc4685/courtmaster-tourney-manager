/**
 * Notification Service for CourtMaster Tournament Management System
 * 
 * Provides comprehensive notification capabilities including:
 * - In-app notifications
 * - Email notifications (placeholder for future integration)
 * - Tournament announcements
 * - Notification preferences management
 * 
 * Integrates with the central event bus to respond to system events.
 */

import { ID, Models, Query } from 'appwrite';
import { databases, COLLECTIONS, APPWRITE_DATABASE_ID } from '../../lib/appwrite';
import eventBus, { EventType, EventPayload } from '../../events/eventBus';

// Notification types
export enum NotificationType {
  REGISTRATION = 'registration',
  MATCH = 'match',
  TOURNAMENT = 'tournament',
  SYSTEM = 'system',
  ANNOUNCEMENT = 'announcement'
}

// Notification priority levels
export enum NotificationPriority {
  LOW = 'low',
  NORMAL = 'normal',
  HIGH = 'high',
  URGENT = 'urgent'
}

// Notification delivery channels
export enum NotificationChannel {
  IN_APP = 'in_app',
  EMAIL = 'email',
  SMS = 'sms',
  PUSH = 'push'
}

// Notification model
export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: NotificationType;
  priority: NotificationPriority;
  read: boolean;
  related_entity_id?: string;
  related_entity_type?: string;
  created_at: string;
  channels?: NotificationChannel[];
  metadata?: Record<string, any>;
}

// Notification creation request
export interface NotificationCreateRequest {
  user_id: string;
  title: string;
  message: string;
  type: NotificationType;
  priority?: NotificationPriority;
  related_entity_id?: string;
  related_entity_type?: string;
  channels?: NotificationChannel[];
  metadata?: Record<string, any>;
}

// User notification preferences
export interface NotificationPreferences {
  user_id: string;
  channels: {
    [NotificationType.REGISTRATION]: NotificationChannel[];
    [NotificationType.MATCH]: NotificationChannel[];
    [NotificationType.TOURNAMENT]: NotificationChannel[];
    [NotificationType.SYSTEM]: NotificationChannel[];
    [NotificationType.ANNOUNCEMENT]: NotificationChannel[];
  };
  disabled?: boolean;
}

// Email configuration (to be implemented with actual email service)
interface EmailConfig {
  from: string;
  templates: {
    [key: string]: {
      subject: string;
      template: string;
    };
  };
}

/**
 * NotificationService class for managing all notification-related operations
 */
class NotificationService {
  private emailConfig: EmailConfig = {
    from: 'notifications@courtmaster-app.com',
    templates: {
      registration_approved: {
        subject: 'Registration Approved',
        template: 'registration_approved'
      },
      registration_rejected: {
        subject: 'Registration Status Update',
        template: 'registration_rejected'
      },
      match_scheduled: {
        subject: 'Match Scheduled',
        template: 'match_scheduled'
      },
      match_started: {
        subject: 'Match Started',
        template: 'match_started'
      },
      match_completed: {
        subject: 'Match Results',
        template: 'match_completed'
      },
      tournament_announcement: {
        subject: 'Tournament Announcement',
        template: 'tournament_announcement'
      }
    }
  };
  
  constructor() {
    this.setupEventListeners();
  }
  
  /**
   * Initialize event listeners for automatic notifications
   */
  private setupEventListeners(): void {
    // Registration events
    eventBus.subscribe(EventType.REGISTRATION_APPROVED, this.handleRegistrationApproved.bind(this));
    eventBus.subscribe(EventType.REGISTRATION_REJECTED, this.handleRegistrationRejected.bind(this));
    
    // Match events
    eventBus.subscribe(EventType.MATCH_SCHEDULED, this.handleMatchScheduled.bind(this));
    eventBus.subscribe(EventType.MATCH_STARTED, this.handleMatchStarted.bind(this));
    eventBus.subscribe(EventType.MATCH_COMPLETED, this.handleMatchCompleted.bind(this));
    eventBus.subscribe(EventType.SCORE_UPDATED, this.handleScoreUpdated.bind(this));
    
    // Tournament events
    eventBus.subscribe(EventType.TOURNAMENT_CREATED, this.handleTournamentCreated.bind(this));
    eventBus.subscribe(EventType.ANNOUNCEMENT_CREATED, this.handleAnnouncementCreated.bind(this));
    
    console.log('NotificationService: Event listeners initialized');
  }
  
  /**
   * Create a notification in the database
   */
  async createNotification(request: NotificationCreateRequest): Promise<Notification> {
    try {
      const notificationData = {
        user_id: request.user_id,
        title: request.title,
        message: request.message,
        type: request.type,
        priority: request.priority || NotificationPriority.NORMAL,
        read: false,
        related_entity_id: request.related_entity_id || null,
        related_entity_type: request.related_entity_type || null,
        channels: JSON.stringify(request.channels || [NotificationChannel.IN_APP]),
        metadata: JSON.stringify(request.metadata || {})
      };
      
      const response = await databases.createDocument(
        APPWRITE_DATABASE_ID,
        COLLECTIONS.NOTIFICATIONS,
        ID.unique(),
        notificationData
      );
      
      // Process email notifications if email channel is specified
      if (request.channels?.includes(NotificationChannel.EMAIL)) {
        await this.sendEmailNotification(request);
      }
      
      return this.mapNotificationFromResponse(response);
    } catch (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  }
  
  /**
   * Get notifications for a specific user
   */
  async getUserNotifications(
    userId: string, 
    options: { limit?: number; offset?: number; onlyUnread?: boolean } = {}
  ): Promise<{ notifications: Notification[]; total: number }> {
    try {
      const { limit = 20, offset = 0, onlyUnread = false } = options;
      
      const queries = [
        Query.equal('user_id', userId),
        Query.orderDesc('$createdAt'),
        Query.limit(limit),
        Query.offset(offset)
      ];
      
      if (onlyUnread) {
        queries.push(Query.equal('read', false));
      }
      
      const response = await databases.listDocuments(
        APPWRITE_DATABASE_ID,
        COLLECTIONS.NOTIFICATIONS,
        queries
      );
      
      const notifications = response.documents.map(doc => this.mapNotificationFromResponse(doc));
      
      return {
        notifications,
        total: response.total
      };
    } catch (error) {
      console.error('Error fetching user notifications:', error);
      throw error;
    }
  }
  
  /**
   * Mark a notification as read
   */
  async markAsRead(notificationId: string): Promise<boolean> {
    try {
      await databases.updateDocument(
        APPWRITE_DATABASE_ID,
        COLLECTIONS.NOTIFICATIONS,
        notificationId,
        { read: true }
      );
      return true;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      return false;
    }
  }
  
  /**
   * Mark all notifications for a user as read
   */
  async markAllAsRead(userId: string): Promise<boolean> {
    try {
      const response = await databases.listDocuments(
        APPWRITE_DATABASE_ID,
        COLLECTIONS.NOTIFICATIONS,
        [Query.equal('user_id', userId), Query.equal('read', false)]
      );
      
      const updatePromises = response.documents.map(doc => 
        databases.updateDocument(
          APPWRITE_DATABASE_ID,
          COLLECTIONS.NOTIFICATIONS,
          doc.$id,
          { read: true }
        )
      );
      
      await Promise.all(updatePromises);
      return true;
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      return false;
    }
  }
  
  /**
   * Delete a notification
   */
  async deleteNotification(notificationId: string): Promise<boolean> {
    try {
      await databases.deleteDocument(
        APPWRITE_DATABASE_ID,
        COLLECTIONS.NOTIFICATIONS,
        notificationId
      );
      return true;
    } catch (error) {
      console.error('Error deleting notification:', error);
      return false;
    }
  }
  
  /**
   * Send bulk notifications to multiple users
   */
  async sendBulkNotifications(
    userIds: string[],
    title: string,
    message: string,
    type: NotificationType,
    options: {
      priority?: NotificationPriority;
      related_entity_id?: string;
      related_entity_type?: string;
      channels?: NotificationChannel[];
      metadata?: Record<string, any>;
    } = {}
  ): Promise<boolean> {
    try {
      const createPromises = userIds.map(userId =>
        this.createNotification({
          user_id: userId,
          title,
          message,
          type,
          priority: options.priority,
          related_entity_id: options.related_entity_id,
          related_entity_type: options.related_entity_type,
          channels: options.channels,
          metadata: options.metadata
        })
      );
      
      await Promise.all(createPromises);
      return true;
    } catch (error) {
      console.error('Error sending bulk notifications:', error);
      return false;
    }
  }
  
  /**
   * Create a tournament-wide announcement
   */
  async createTournamentAnnouncement(
    tournamentId: string,
    title: string,
    message: string,
    createdBy: string,
    options: {
      priority?: string;
      target_audience?: string;
      target_division_id?: string;
      display_start?: Date;
      display_end?: Date;
    } = {}
  ): Promise<any> {
    try {
      const announcementData = {
        tournament_id: tournamentId,
        title,
        message,
        created_by: createdBy,
        priority: options.priority || 'normal',
        target_audience: options.target_audience || 'all',
        target_division_id: options.target_division_id || null,
        display_start: options.display_start ? options.display_start.toISOString() : null,
        display_end: options.display_end ? options.display_end.toISOString() : null,
        is_active: true
      };
      
      const response = await databases.createDocument(
        APPWRITE_DATABASE_ID,
        COLLECTIONS.ANNOUNCEMENTS,
        ID.unique(),
        announcementData
      );
      
      // Emit an event for the announcement creation
      eventBus.emit(EventType.ANNOUNCEMENT_CREATED, {
        announcementId: response.$id,
        tournamentId,
        title,
        message
      }, 'NotificationService');
      
      return response;
    } catch (error) {
      console.error('Error creating tournament announcement:', error);
      throw error;
    }
  }
  
  /**
   * Get active announcements for a tournament
   */
  async getTournamentAnnouncements(
    tournamentId: string,
    options: {
      limit?: number;
      offset?: number;
      audience?: string;
      divisionId?: string;
    } = {}
  ): Promise<any> {
    try {
      const { limit = 20, offset = 0, audience, divisionId } = options;
      
      const queries = [
        Query.equal('tournament_id', tournamentId),
        Query.equal('is_active', true),
        Query.orderDesc('$createdAt'),
        Query.limit(limit),
        Query.offset(offset)
      ];
      
      // Filter by audience if specified
      if (audience) {
        queries.push(Query.equal('target_audience', audience));
      }
      
      // Filter by division if specified
      if (divisionId) {
        queries.push(Query.equal('target_division_id', divisionId));
      }
      
      // Filter by display_start only in the query
      const now = new Date().toISOString();
      // Only add display_start condition, handle display_end after fetching
      queries.push(Query.lessThanEqual('display_start', now));
      
      const response = await databases.listDocuments(
        APPWRITE_DATABASE_ID,
        COLLECTIONS.ANNOUNCEMENTS,
        queries
      );
      
      // Filter results to match time window, properly handling null display_end values
      const filteredAnnouncements = response.documents.filter(doc => {
        const displayStart = doc.display_start;
        const displayEnd = doc.display_end;
        return (!displayStart || displayStart <= now) && (!displayEnd || displayEnd >= now);
      });
      
      return {
        announcements: filteredAnnouncements,
        total: filteredAnnouncements.length
      };
    } catch (error) {
      console.error('Error fetching tournament announcements:', error);
      throw error;
    }
  }
  
  // Event handlers for automatic notifications
  
  /**
   * Handle registration approved event
   */
  private async handleRegistrationApproved(payload: EventPayload): Promise<void> {
    const { data } = payload;
    
    if (!data.playerId) return;
    
    await this.createNotification({
      user_id: data.playerId,
      title: 'Registration Approved',
      message: `Your registration for ${data.tournamentName || 'the tournament'} has been approved.`,
      type: NotificationType.REGISTRATION,
      priority: NotificationPriority.NORMAL,
      related_entity_id: data.tournamentId,
      related_entity_type: 'tournament',
      channels: [NotificationChannel.IN_APP, NotificationChannel.EMAIL]
    });
  }
  
  /**
   * Handle registration rejected event
   */
  private async handleRegistrationRejected(payload: EventPayload): Promise<void> {
    const { data } = payload;
    
    if (!data.playerId) return;
    
    await this.createNotification({
      user_id: data.playerId,
      title: 'Registration Update',
      message: `Your registration for ${data.tournamentName || 'the tournament'} was not approved. Reason: ${data.reason || 'Not specified'}`,
      type: NotificationType.REGISTRATION,
      priority: NotificationPriority.HIGH,
      related_entity_id: data.tournamentId,
      related_entity_type: 'tournament',
      channels: [NotificationChannel.IN_APP, NotificationChannel.EMAIL]
    });
  }
  
  /**
   * Handle match scheduled event
   */
  private async handleMatchScheduled(payload: EventPayload): Promise<void> {
    const { data } = payload;
    
    // Notify all players involved in the match
    const playerIds = [data.player1Id, data.player2Id].filter(Boolean);
    
    if (playerIds.length === 0) return;
    
    const scheduledTime = data.scheduledTime 
      ? new Date(data.scheduledTime).toLocaleString() 
      : 'Time not specified';
    
    const courtInfo = data.courtName 
      ? `on court ${data.courtName}` 
      : '';
    
    for (const playerId of playerIds) {
      await this.createNotification({
        user_id: playerId,
        title: 'Match Scheduled',
        message: `Your match has been scheduled for ${scheduledTime} ${courtInfo}.`,
        type: NotificationType.MATCH,
        priority: NotificationPriority.HIGH,
        related_entity_id: data.matchId,
        related_entity_type: 'match',
        channels: [NotificationChannel.IN_APP, NotificationChannel.EMAIL]
      });
    }
  }
  
  /**
   * Handle match started event
   */
  private async handleMatchStarted(payload: EventPayload): Promise<void> {
    const { data } = payload;
    
    // Notify all players involved in the match
    const playerIds = [data.player1Id, data.player2Id].filter(Boolean);
    
    if (playerIds.length === 0) return;
    
    const courtInfo = data.courtName 
      ? `on court ${data.courtName}` 
      : '';
    
    for (const playerId of playerIds) {
      await this.createNotification({
        user_id: playerId,
        title: 'Match Started',
        message: `Your match has started ${courtInfo}.`,
        type: NotificationType.MATCH,
        priority: NotificationPriority.NORMAL,
        related_entity_id: data.matchId,
        related_entity_type: 'match',
        channels: [NotificationChannel.IN_APP]
      });
    }
  }
  
  /**
   * Handle match completed event
   */
  private async handleMatchCompleted(payload: EventPayload): Promise<void> {
    const { data } = payload;
    
    // Notify all players involved in the match
    const playerIds = [data.player1Id, data.player2Id].filter(Boolean);
    
    if (playerIds.length === 0) return;
    
    for (const playerId of playerIds) {
      const isWinner = playerId === data.winnerId;
      const message = isWinner 
        ? `Congratulations! You won your match. Final score: ${data.scoreDisplay || 'Not available'}`
        : `Your match has ended. Final score: ${data.scoreDisplay || 'Not available'}`;
      
      await this.createNotification({
        user_id: playerId,
        title: 'Match Completed',
        message,
        type: NotificationType.MATCH,
        priority: NotificationPriority.NORMAL,
        related_entity_id: data.matchId,
        related_entity_type: 'match',
        channels: [NotificationChannel.IN_APP]
      });
    }
  }
  
  /**
   * Handle score updated event
   */
  private async handleScoreUpdated(payload: EventPayload): Promise<void> {
    // This is primarily for public view updates, not player notifications
    // Could be used for spectator notifications in the future
  }
  
  /**
   * Handle tournament created event
   */
  private async handleTournamentCreated(payload: EventPayload): Promise<void> {
    // System notification to admins or similar
    // Not implementing specific behavior here
  }
  
  /**
   * Handle announcement created event
   */
  private async handleAnnouncementCreated(payload: EventPayload): Promise<void> {
    const { data } = payload;
    
    // This would typically trigger notifications to all relevant tournament participants
    // Implementation depends on how participants are tracked and stored
    
    // For now, we'll just log it
    console.log('Announcement created:', data.title);
    
    // The actual implementation would fetch all tournament participants
    // and send them notifications based on the announcement target audience
  }
  
  /**
   * Send an email notification (placeholder for future email service integration)
   */
  private async sendEmailNotification(request: NotificationCreateRequest): Promise<boolean> {
    // This is a placeholder for actual email service implementation
    console.log('Sending email notification:', {
      to: request.user_id, // This would be the user's email in a real implementation
      subject: request.title,
      body: request.message
    });
    
    // In a real implementation, this would connect to an email service like SendGrid, Mailgun, etc.
    return true;
  }
  
  /**
   * Map API response to Notification interface
   */
  private mapNotificationFromResponse(response: Models.Document): Notification {
    return {
      id: response.$id,
      user_id: response.user_id,
      title: response.title,
      message: response.message,
      type: response.type,
      priority: response.priority,
      read: response.read,
      related_entity_id: response.related_entity_id,
      related_entity_type: response.related_entity_type,
      created_at: response.$createdAt,
      channels: response.channels ? JSON.parse(response.channels) : [NotificationChannel.IN_APP],
      metadata: response.metadata ? JSON.parse(response.metadata) : {}
    };
  }
}

export default new NotificationService();
