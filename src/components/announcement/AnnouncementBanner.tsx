/**
 * Announcement Banner Component for CourtMaster Tournament Management System
 * 
 * Displays tournament announcements with support for different announcement types,
 * auto-dismiss functionality, and real-time updates.
 */

import React, { useState, useEffect } from 'react';
import { AlertCircle, Bell, Info, X, Clock, Volume2 } from 'lucide-react';
import { subscribeToDocument } from '../../lib/appwrite';
import { 
  Alert,
  AlertDescription,
  AlertTitle
} from '../../components/ui/alert';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Separator } from '../../components/ui/separator';

// Define announcement types
export type AnnouncementPriority = 'low' | 'normal' | 'high' | 'urgent';

export interface Announcement {
  id: string;
  title: string;
  message: string;
  priority: AnnouncementPriority;
  created_by: string;
  created_at: string;
  display_start?: string;
  display_end?: string;
  target_audience?: string;
  target_division_id?: string;
  is_active: boolean;
}

interface AnnouncementBannerProps {
  tournamentId: string;
  announcement?: Announcement;
  onClose?: (announcementId: string) => void;
  onClick?: () => void;
  autoDismiss?: boolean;
  autoDismissTime?: number; // in milliseconds
  showCreatedAt?: boolean;
  className?: string;
}

export const AnnouncementBanner: React.FC<AnnouncementBannerProps> = ({
  tournamentId,
  announcement,
  onClose,
  onClick,
  autoDismiss = false,
  autoDismissTime = 10000, // 10 seconds default
  showCreatedAt = true,
  className = ''
}) => {
  const [isVisible, setIsVisible] = useState<boolean>(true);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(
    autoDismiss ? autoDismissTime : null
  );

  useEffect(() => {
    // Reset visibility and timer when announcement changes
    setIsVisible(true);
    setTimeRemaining(autoDismiss ? autoDismissTime : null);
  }, [announcement, autoDismiss, autoDismissTime]);

  // Handle auto-dismiss countdown
  useEffect(() => {
    if (!isVisible || timeRemaining === null) {
      return;
    }

    const timer = setTimeout(() => {
      if (timeRemaining <= 0) {
        setIsVisible(false);
        if (announcement && onClose) {
          onClose(announcement.id);
        }
      } else {
        setTimeRemaining(prev => (prev !== null ? prev - 1000 : null));
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [timeRemaining, isVisible, announcement, onClose]);

  if (!announcement || !isVisible) {
    return null;
  }

  // Priority to variant mapping
  const getVariant = (priority: AnnouncementPriority) => {
    switch (priority) {
      case 'urgent':
        return 'destructive';
      case 'high':
        return 'default';
      case 'normal':
        return 'secondary';
      case 'low':
        return 'outline';
      default:
        return 'secondary';
    }
  };

  // Icon based on priority
  const PriorityIcon = () => {
    switch (announcement.priority) {
      case 'urgent':
        return <AlertCircle className="h-5 w-5" />;
      case 'high':
        return <Volume2 className="h-5 w-5" />;
      case 'normal':
        return <Bell className="h-5 w-5" />;
      case 'low':
        return <Info className="h-5 w-5" />;
      default:
        return <Info className="h-5 w-5" />;
    }
  };

  // Format the creation timestamp
  const formattedTime = announcement.created_at
    ? new Date(announcement.created_at).toLocaleString()
    : '';

  const handleClose = () => {
    setIsVisible(false);
    if (onClose) {
      onClose(announcement.id);
    }
  };

  // Calculate time remaining for display
  const formattedTimeRemaining = timeRemaining !== null
    ? Math.ceil(timeRemaining / 1000)
    : null;

  return (
    <Alert
      variant={getVariant(announcement.priority)}
      className={`mb-4 transition-all duration-300 ease-in-out ${className}`}
      onClick={onClick}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <PriorityIcon />
          <AlertTitle className="ml-2">{announcement.title}</AlertTitle>
          <Badge 
            variant={announcement.priority === 'urgent' ? 'destructive' : 'outline'}
            className="ml-2"
          >
            {announcement.priority}
          </Badge>
          {formattedTimeRemaining !== null && (
            <div className="ml-2 flex items-center text-sm">
              <Clock className="h-3 w-3 mr-1" />
              {formattedTimeRemaining}s
            </div>
          )}
        </div>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={handleClose}
          className="h-6 w-6 p-0"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
      <Separator className="my-2" />
      <AlertDescription>
        <div className="text-sm whitespace-pre-wrap">{announcement.message}</div>
        {showCreatedAt && (
          <div className="text-xs mt-2 opacity-70">
            {formattedTime}
          </div>
        )}
      </AlertDescription>
    </Alert>
  );
};

interface AnnouncementBannerContainerProps {
  tournamentId: string;
  maxDisplayed?: number;
  autoDismiss?: boolean;
  autoDismissTime?: number;
  filter?: {
    priority?: AnnouncementPriority[];
    division?: string;
  };
  onAnnouncementClick?: (announcement: Announcement) => void;
  className?: string;
}

/**
 * Container component that fetches and displays announcements
 */
export const AnnouncementBannerContainer: React.FC<AnnouncementBannerContainerProps> = ({
  tournamentId,
  maxDisplayed = 3,
  autoDismiss = true,
  autoDismissTime = 10000,
  filter,
  onAnnouncementClick,
  className = ''
}) => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Fetch announcements on mount and set up subscription
  useEffect(() => {
    let unsubscribe: (() => void) | null = null;

    const fetchAnnouncements = async () => {
      try {
        setIsLoading(true);
        // Import NotificationService
        const { default: NotificationService } = await import('../../services/notification/NotificationService');

        // Fetch real announcements from Appwrite
        const response = await NotificationService.getTournamentAnnouncements(tournamentId);

        // Map the response to our Announcement interface
        const fetchedAnnouncements: Announcement[] = response.announcements.map((ann: any) => ({
          id: ann.$id,
          title: ann.title,
          message: ann.message,
          priority: ann.priority as AnnouncementPriority,
          created_by: ann.created_by,
          created_at: ann.$createdAt,
          display_start: ann.display_start,
          display_end: ann.display_end,
          target_audience: ann.target_audience,
          target_division_id: ann.target_division_id,
          is_active: ann.is_active
        }));

        setAnnouncements(fetchedAnnouncements);
        setIsLoading(false);

        // Set up real-time subscription for announcement changes
        const { subscribeToCollection } = await import('../../lib/appwrite');
        const { COLLECTIONS } = await import('../../lib/appwrite');
        unsubscribe = subscribeToCollection(COLLECTIONS.ANNOUNCEMENTS, (response: any) => {
          // Handle real-time updates
          const { events, payload } = response;
          if (events.includes('databases.*.collections.*.documents.*.create')) {
            // New announcement created
            if (payload.tournament_id === tournamentId) {
              const newAnnouncement: Announcement = {
                id: payload.$id,
                title: payload.title,
                message: payload.message,
                priority: payload.priority as AnnouncementPriority,
                created_by: payload.created_by,
                created_at: payload.$createdAt,
                display_start: payload.display_start,
                display_end: payload.display_end,
                target_audience: payload.target_audience,
                target_division_id: payload.target_division_id,
                is_active: payload.is_active
              };
              setAnnouncements(prev => [newAnnouncement, ...prev]);
            }
          } else if (events.includes('databases.*.collections.*.documents.*.update')) {
            // Announcement updated
            if (payload.tournament_id === tournamentId) {
              const updatedAnnouncement: Announcement = {
                id: payload.$id,
                title: payload.title,
                message: payload.message,
                priority: payload.priority as AnnouncementPriority,
                created_by: payload.created_by,
                created_at: payload.$createdAt,
                display_start: payload.display_start,
                display_end: payload.display_end,
                target_audience: payload.target_audience,
                target_division_id: payload.target_division_id,
                is_active: payload.is_active
              };
              setAnnouncements(prev => prev.map(ann => ann.id === payload.$id ? updatedAnnouncement : ann));
            }
          } else if (events.includes('databases.*.collections.*.documents.*.delete')) {
            // Announcement deleted
            setAnnouncements(prev => prev.filter(ann => ann.id !== payload.$id));
          }
        });
      } catch (error) {
        console.error('Error fetching announcements:', error);
        setIsLoading(false);
      }
    };

    fetchAnnouncements();

    // Cleanup subscription on unmount
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [tournamentId]);

  const handleDismiss = (announcementId: string) => {
    setDismissedIds(prev => new Set([...prev, announcementId]));
  };

  // Filter and limit announcements for display
  const visibleAnnouncements = announcements
    .filter(announcement => !dismissedIds.has(announcement.id) && announcement.is_active)
    .filter(announcement => {
      // Apply any additional filters
      if (!filter) return true;

      // Filter by priority
      if (filter.priority && filter.priority.length > 0) {
        if (!filter.priority.includes(announcement.priority)) {
          return false;
        }
      }

      // Filter by division
      if (filter.division && announcement.target_division_id) {
        if (announcement.target_division_id !== filter.division) {
          return false;
        }
      }

      return true;
    })
    // Sort by priority (urgent first) and then by creation date (newest first)
    .sort((a, b) => {
      const priorityOrder: Record<AnnouncementPriority, number> = {
        urgent: 0,
        high: 1,
        normal: 2,
        low: 3
      };

      if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      }

      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    })
    .slice(0, maxDisplayed);

  if (isLoading) {
    return <div className="h-8 animate-pulse bg-muted rounded-md"></div>;
  }

  if (visibleAnnouncements.length === 0) {
    return null;
  }

  return (
    <div className={`space-y-2 ${className}`}>
      {visibleAnnouncements.map(announcement => (
        <AnnouncementBanner
          key={announcement.id}
          tournamentId={tournamentId}
          announcement={announcement}
          onClose={handleDismiss}
          onClick={() => onAnnouncementClick?.(announcement)}
          autoDismiss={autoDismiss}
          autoDismissTime={autoDismissTime}
          className="cursor-pointer transition-all hover:shadow-md"
        />
      ))}
    </div>
  );
};

export default AnnouncementBanner;
