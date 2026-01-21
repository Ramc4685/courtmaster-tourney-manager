import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Megaphone,
  X,
  AlertTriangle,
  Info,
  AlertCircle,
  Clock,
  ChevronLeft,
  ChevronRight,
  Volume2,
  VolumeX
} from 'lucide-react';
import { notificationService, TournamentAnnouncement } from '../../services/notificationService';
import eventBus, { EventType } from '@/events/eventBus';
import { NotificationPriority } from '../../types/entities';

interface Announcement {
  id: string;
  title: string;
  message: string;
  priority: NotificationPriority;
  createdAt: Date;
  displayStart?: Date;
  displayEnd?: Date;
  isUrgent?: boolean;
  category?: string;
}

interface AnnouncementBannerProps {
  tournamentId: string;
  position?: 'top' | 'bottom' | 'overlay';
  autoRotate?: boolean;
  rotationInterval?: number;
  showControls?: boolean;
  maxHeight?: string;
  soundEnabled?: boolean;
  className?: string;
}

export const AnnouncementBanner: React.FC<AnnouncementBannerProps> = ({
  tournamentId,
  position = 'top',
  autoRotate = true,
  rotationInterval = 8000,
  showControls = true,
  maxHeight = '120px',
  soundEnabled = false,
  className
}) => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const [loading, setLoading] = useState(true);
  const [soundMuted, setSoundMuted] = useState(!soundEnabled);

  const rotationTimerRef = useRef<NodeJS.Timeout | null>(null);
  const mountedRef = useRef(true);

  const toBannerAnnouncement = (announcement: TournamentAnnouncement): Announcement => ({
    id: announcement.id,
    title: announcement.title || 'Tournament Announcement',
    message: announcement.message || '',
    priority: announcement.priority,
    createdAt: announcement.createdAt || new Date(),
    displayStart: announcement.displayStart,
    displayEnd: announcement.displayEnd,
    isUrgent: [NotificationPriority.URGENT, NotificationPriority.HIGH].includes(announcement.priority),
    category: announcement.category
  });

  const fetchAnnouncements = useCallback(async () => {
    try {
      const allAnnouncements = await notificationService.getTournamentAnnouncements(tournamentId);

      // Filter active announcements
      const now = new Date();
      const activeAnnouncements = allAnnouncements
        .filter(announcement => {
          const start = announcement.displayStart || announcement.createdAt;
          const end = announcement.displayEnd;

          return (
            announcement.status === 'ACTIVE' &&
            start &&
            start.getTime() <= now.getTime() &&
            (!end || end.getTime() > now.getTime())
          );
        })
        .map(toBannerAnnouncement)
        .sort((a, b) => {
          // Sort by priority first, then by creation time
          const priorityOrder = {
            [NotificationPriority.URGENT]: 0,
            [NotificationPriority.HIGH]: 1,
            [NotificationPriority.NORMAL]: 2,
            [NotificationPriority.LOW]: 3
          };

          const aPriority = priorityOrder[a.priority] ?? 4;
          const bPriority = priorityOrder[b.priority] ?? 4;

          if (aPriority !== bPriority) {
            return aPriority - bPriority;
          }

          return b.createdAt.getTime() - a.createdAt.getTime();
        });

      if (mountedRef.current) {
        setAnnouncements(activeAnnouncements);
        setLoading(false);

        // Reset current index if it's out of bounds
        if (currentIndex >= activeAnnouncements.length) {
          setCurrentIndex(0);
        }
      }
    } catch (error) {
      console.error('Error fetching announcements:', error);
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, [tournamentId, currentIndex]);

  const setupRotationTimer = useCallback(() => {
    if (!autoRotate || announcements.length <= 1 || isPaused) {
      return;
    }

    if (rotationTimerRef.current) {
      clearTimeout(rotationTimerRef.current);
    }

    rotationTimerRef.current = setTimeout(() => {
      setCurrentIndex(prev => (prev + 1) % announcements.length);
    }, rotationInterval);
  }, [autoRotate, announcements.length, isPaused, rotationInterval]);

  const playNotificationSound = useCallback(() => {
    if (soundMuted || !soundEnabled) return;

    // Create a subtle notification sound
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(400, audioContext.currentTime + 0.1);

      gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.1);
    } catch (error) {
      // Ignore audio errors
    }
  }, [soundMuted, soundEnabled]);

  const getPriorityColor = (priority: NotificationPriority) => {
    switch (priority) {
      case NotificationPriority.URGENT:
        return 'border-red-500 bg-red-50 text-red-900';
      case NotificationPriority.HIGH:
        return 'border-orange-500 bg-orange-50 text-orange-900';
      case NotificationPriority.NORMAL:
        return 'border-blue-500 bg-blue-50 text-blue-900';
      case NotificationPriority.LOW:
        return 'border-gray-500 bg-gray-50 text-gray-900';
      default:
        return 'border-gray-500 bg-gray-50 text-gray-900';
    }
  };

  const getPriorityIcon = (priority: NotificationPriority) => {
    switch (priority) {
      case NotificationPriority.URGENT:
        return <AlertTriangle className="h-5 w-5 text-red-600" />;
      case NotificationPriority.HIGH:
        return <AlertCircle className="h-5 w-5 text-orange-600" />;
      case NotificationPriority.NORMAL:
        return <Info className="h-5 w-5 text-blue-600" />;
      case NotificationPriority.LOW:
        return <Info className="h-5 w-5 text-gray-600" />;
      default:
        return <Megaphone className="h-5 w-5 text-gray-600" />;
    }
  };

  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    }).format(date);
  };

  const nextAnnouncement = () => {
    setCurrentIndex(prev => (prev + 1) % announcements.length);
  };

  const previousAnnouncement = () => {
    setCurrentIndex(prev => (prev - 1 + announcements.length) % announcements.length);
  };

  const dismissBanner = () => {
    setIsVisible(false);
  };

  // Event bus subscription for new announcements
  useEffect(() => {
    const handleAnnouncementCreated = (data: any) => {
      if (data.tournamentId === tournamentId) {
        fetchAnnouncements();
        playNotificationSound();
      }
    };

    eventBus.on(EventType.ANNOUNCEMENT_CREATED, handleAnnouncementCreated);

    return () => {
      eventBus.off(EventType.ANNOUNCEMENT_CREATED, handleAnnouncementCreated);
    };
  }, [tournamentId, fetchAnnouncements, playNotificationSound]);

  // Initial load
  useEffect(() => {
    fetchAnnouncements();
  }, [fetchAnnouncements]);

  // Setup rotation timer
  useEffect(() => {
    setupRotationTimer();

    return () => {
      if (rotationTimerRef.current) {
        clearTimeout(rotationTimerRef.current);
      }
    };
  }, [setupRotationTimer]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false;
      if (rotationTimerRef.current) {
        clearTimeout(rotationTimerRef.current);
      }
    };
  }, []);

  // Don't render if no announcements, loading, or hidden
  if (loading || !isVisible || announcements.length === 0) {
    return null;
  }

  const currentAnnouncement = announcements[currentIndex];
  if (!currentAnnouncement) return null;

  const positionClasses = {
    top: 'top-0',
    bottom: 'bottom-0',
    overlay: 'top-4'
  };

  const containerClasses = [
    className,
    position === 'overlay' ? 'fixed inset-x-4 z-50' : 'w-full',
    positionClasses[position],
    'transition-all duration-300'
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={containerClasses} style={{ maxHeight }}>
      <Card
        className={`${getPriorityColor(currentAnnouncement.priority)} ${
          currentAnnouncement.isUrgent ? 'animate-pulse border-2' : 'border'
        } shadow-lg`}
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-start space-x-3 flex-1 min-w-0">
              {getPriorityIcon(currentAnnouncement.priority)}

              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2 mb-1">
                  <h4 className="font-semibold text-lg leading-tight">
                    {currentAnnouncement.title}
                  </h4>
                  <Badge variant="outline" className="text-xs">
                    {currentAnnouncement.priority.toLowerCase()}
                  </Badge>
                  <span className="text-xs opacity-75">
                    {formatTime(currentAnnouncement.createdAt)}
                  </span>
                </div>

                <p className="text-sm leading-relaxed line-clamp-2">
                  {currentAnnouncement.message}
                </p>

                {currentAnnouncement.category && (
                  <Badge variant="secondary" className="mt-2 text-xs">
                    {currentAnnouncement.category}
                  </Badge>
                )}
              </div>
            </div>

            {/* Controls */}
            {showControls && (
              <div className="flex items-center space-x-2 ml-4">
                {announcements.length > 1 && (
                  <>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={previousAnnouncement}
                      className="h-8 w-8 p-0"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>

                    <div className="text-xs opacity-75">
                      {currentIndex + 1} / {announcements.length}
                    </div>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={nextAnnouncement}
                      className="h-8 w-8 p-0"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </>
                )}

                {soundEnabled && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSoundMuted(!soundMuted)}
                    className="h-8 w-8 p-0"
                  >
                    {soundMuted ? (
                      <VolumeX className="h-4 w-4" />
                    ) : (
                      <Volume2 className="h-4 w-4" />
                    )}
                  </Button>
                )}

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={dismissBanner}
                  className="h-8 w-8 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>

          {/* Progress indicators for multiple announcements */}
          {announcements.length > 1 && (
            <div className="flex justify-center space-x-1 mt-3">
              {announcements.map((_, index) => (
                <div
                  key={index}
                  className={`h-1 w-8 rounded-full transition-all duration-300 ${
                    index === currentIndex
                      ? 'bg-current opacity-80'
                      : 'bg-current opacity-30'
                  }`}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
