import { databases, APPWRITE_DATABASE_ID } from "@/lib/appwrite";
import { Notification, NotificationType } from "@/types/entities";
import { COLLECTIONS } from "@/lib/appwrite";
import { Query } from "appwrite";
import { NotificationPriority } from "@/services/notification/NotificationService";

// Define a type for the notification payload for insertion, with only the fields we need
type NotificationInsert = {
  user_id: string;
  title: string;
  message: string;
  type: NotificationType;
  read?: boolean;
  related_entity_id?: string;
  related_entity_type?: string;
};

export interface TournamentAnnouncement {
  id: string;
  title: string;
  message: string;
  status: 'ACTIVE' | 'INACTIVE' | 'SCHEDULED';
  priority: NotificationPriority;
  createdAt: Date;
  displayStart?: Date;
  displayEnd?: Date;
  targetAudience?: string;
  targetDivisionId?: string;
  category?: string;
  createdBy?: string;
}

export class NotificationService {
  /**
   * Fetches notifications for a specific user.
   * @param userId - The ID of the user.
   * @returns A promise resolving to an array of notifications.
   */
  async getNotifications(userId: string): Promise<Notification[]> {
    console.log(`[NotificationService] Fetching notifications for user: ${userId}`);
    const response = await databases.listDocuments(
      APPWRITE_DATABASE_ID,
      COLLECTIONS.NOTIFICATIONS,
      [Query.equal("user_id", userId), Query.orderDesc("$createdAt")]
    );

    console.log(`[NotificationService] Found ${response.documents.length} notifications for user ${userId}`);
    // Apply proper type mapping from Appwrite documents to our Notification type
    return response.documents.map(doc => ({
      id: doc.$id,
      user_id: doc.user_id,
      title: doc.title,
      message: doc.message,
      type: doc.type,
      read: doc.read ?? false,
      created_at: doc.$createdAt,
      updated_at: doc.$updatedAt,
      related_entity_id: doc.related_entity_id,
      related_entity_type: doc.related_entity_type
    }));
  }

  /**
   * Creates a single notification for a specific user.
   * @param notification - The notification data (user_id, title, message, type).
   * @returns A promise resolving to the created notification.
   */
  async createNotification(
    notification: Pick<
      NotificationInsert,
      "user_id" | "title" | "message" | "type" | "related_entity_id" | "related_entity_type"
    >
  ): Promise<Notification> {
    console.log(`[NotificationService] Creating notification for user: ${notification.user_id}`);
    const document = await databases.createDocument(
      APPWRITE_DATABASE_ID,
      COLLECTIONS.NOTIFICATIONS,
      "unique()",
      {
        ...notification,
        read: false, // Default to unread
      }
    );

    console.log(`[NotificationService] Notification created with ID: ${document.$id}`);
    return {
      id: document.$id,
      user_id: document.user_id,
      title: document.title,
      message: document.message,
      type: document.type,
      read: document.read ?? false,
      created_at: document.$createdAt,
      updated_at: document.$updatedAt,
      related_entity_id: document.related_entity_id,
      related_entity_type: document.related_entity_type
    };
  }

  /**
   * Creates multiple notifications, typically for broadcasting.
   * @param notifications - An array of notification data objects.
   * @returns A promise resolving to an array of created notifications.
   */
  async createMultipleNotifications(
    notifications: NotificationInsert[]
  ): Promise<Notification[]> {
    if (!notifications || notifications.length === 0) {
      console.log("[NotificationService] No notifications to create.");
      return [];
    }
    console.log(`[NotificationService] Creating ${notifications.length} notifications.`);
    
    // Ensure default values are set if not provided
    const notificationsToInsert = notifications.map(n => ({ ...n, read: n.read ?? false }));

    const createdNotifications: Notification[] = [];
    for (const notification of notificationsToInsert) {
      const document = await databases.createDocument(
        APPWRITE_DATABASE_ID,
        COLLECTIONS.NOTIFICATIONS,
        "unique()",
        notification
      );
      
      // Map the document to our Notification type
      createdNotifications.push({
        id: document.$id,
        user_id: document.user_id,
        title: document.title,
        message: document.message,
        type: document.type,
        read: document.read ?? false,
        created_at: document.$createdAt,
        updated_at: document.$updatedAt,
        related_entity_id: document.related_entity_id,
        related_entity_type: document.related_entity_type
      });
    }

    console.log(`[NotificationService] Successfully created ${createdNotifications.length} notifications.`);
    return createdNotifications;
  }

  /**
   * Marks a specific notification as read.
   * @param notificationId - The ID of the notification to mark as read.
   * @returns A promise resolving when the operation is complete.
   */
  async markAsRead(notificationId: string): Promise<void> {
    console.log(`[NotificationService] Marking notification as read: ${notificationId}`);
    await databases.updateDocument(
      APPWRITE_DATABASE_ID,
      COLLECTIONS.NOTIFICATIONS,
      notificationId,
      { read: true }
    );

    console.log(`[NotificationService] Notification ${notificationId} marked as read.`);
  }

  /**
   * Marks all unread notifications for a user as read.
   * @param userId - The ID of the user.
   * @returns A promise resolving when the operation is complete.
   */
  async markAllAsRead(userId: string): Promise<void> {
    console.log(`[NotificationService] Marking all notifications as read for user: ${userId}`);
    // Appwrite doesn't support bulk updates, so we need to fetch and update individually
    const response = await databases.listDocuments(
      APPWRITE_DATABASE_ID,
      COLLECTIONS.NOTIFICATIONS,
      [Query.equal("user_id", userId), Query.equal("read", false)]
    );
    
    for (const notification of response.documents) {
      await databases.updateDocument(
        APPWRITE_DATABASE_ID,
        COLLECTIONS.NOTIFICATIONS,
        notification.$id,
        { read: true }
      );
    }

    console.log(`[NotificationService] All notifications marked as read for user ${userId}.`);
  }

  /**
   * Deletes a specific notification.
   * @param notificationId - The ID of the notification to delete.
   * @returns A promise resolving when the operation is complete.
   */
  async deleteNotification(notificationId: string): Promise<void> {
    console.log(`[NotificationService] Deleting notification: ${notificationId}`);
    await databases.deleteDocument(
      APPWRITE_DATABASE_ID,
      COLLECTIONS.NOTIFICATIONS,
      notificationId
    );

    console.log(`[NotificationService] Notification ${notificationId} deleted.`);
  }

  async getTournamentAnnouncements(tournamentId: string): Promise<TournamentAnnouncement[]> {
    console.log(`[NotificationService] Fetching announcements for tournament: ${tournamentId}`);

    try {
      const response = await databases.listDocuments(
        APPWRITE_DATABASE_ID,
        COLLECTIONS.ANNOUNCEMENTS,
        [
          Query.equal('tournament_id', tournamentId),
          Query.orderDesc('$createdAt')
        ]
      );

      const normalizePriority = (value: unknown): NotificationPriority => {
        const normalized = String(value ?? '').toLowerCase();
        switch (normalized) {
          case NotificationPriority.URGENT:
            return NotificationPriority.URGENT;
          case NotificationPriority.HIGH:
            return NotificationPriority.HIGH;
          case NotificationPriority.LOW:
            return NotificationPriority.LOW;
          default:
            return NotificationPriority.NORMAL;
        }
      };

      return response.documents.map((doc) => {
        const rawStatus = (doc.status as string) || (doc.is_active ? 'ACTIVE' : 'INACTIVE');
        const status = rawStatus.toUpperCase() as 'ACTIVE' | 'INACTIVE' | 'SCHEDULED';

        return {
          id: doc.$id,
          title: doc.title ?? '',
          message: doc.message ?? '',
          status,
          priority: normalizePriority(doc.priority),
          createdAt: new Date(doc.$createdAt),
          displayStart: doc.display_start ? new Date(doc.display_start) : undefined,
          displayEnd: doc.display_end ? new Date(doc.display_end) : undefined,
          targetAudience: doc.target_audience ?? undefined,
          targetDivisionId: doc.target_division_id ?? undefined,
          category: doc.category ?? undefined,
          createdBy: doc.created_by ?? undefined
        } satisfies TournamentAnnouncement;
      });
    } catch (error) {
      console.error('[NotificationService] Failed to fetch tournament announcements:', error);
      throw error;
    }
  }

  /**
   * Sends an announcement to all participants of a tournament.
   * This requires fetching participant user IDs first.
   * @param tournamentId - The ID of the tournament.
   * @param title - The title of the announcement.
   * @param message - The message content of the announcement.
   * @returns A promise resolving to the created notification objects.
   */
  async sendTournamentAnnouncement(
    tournamentId: string,
    title: string,
    message: string
  ): Promise<Notification[]> {
    console.log(`[NotificationService] Sending announcement for tournament: ${tournamentId}`);
    try {
      // 1. Fetch all registrations for the tournament
      const response = await databases.listDocuments(
        APPWRITE_DATABASE_ID,
        COLLECTIONS.REGISTRATIONS,
        [
          Query.equal("tournament_id", tournamentId),
          Query.equal("status", "confirmed") // Only notify confirmed participants
        ]
      );
      const registrations = response.documents;



      if (!registrations || registrations.length === 0) {
        console.log("[NotificationService] No confirmed participants found for tournament.");
        return [];
      }

      const userIds = registrations.map((reg) => reg.user_id).filter((id): id is string => !!id);
      const uniqueUserIds = [...new Set(userIds)];

      console.log(`[NotificationService] Found ${uniqueUserIds.length} unique participants.`);

      // 2. Create notification objects for each user
      const notificationsToCreate: NotificationInsert[] = uniqueUserIds.map(
        (userId) => ({
          user_id: userId,
          title: title,
          message: message,
          type: NotificationType.ANNOUNCEMENT,
          read: false,
          related_entity_id: tournamentId,
          related_entity_type: "tournament",
        } as NotificationInsert)
      );

      // 3. Use createMultipleNotifications to insert them
      return await this.createMultipleNotifications(notificationsToCreate);

    } catch (error) {
      console.error("[NotificationService] Failed to send tournament announcement:", error);
      // Rethrow or handle as appropriate
      throw error;
    }
  }
  
  // TODO: Add methods for sending match reminders, score updates, etc.
  // These might involve joining with match schedules, user preferences etc.
  
  // TODO: Consider adding methods to trigger backend functions for Email/SMS
  // async triggerEmailNotification(userId: string, subject: string, body: string) { ... }
  // async triggerSmsNotification(userId: string, message: string) { ... }
}

export const notificationService = new NotificationService();
