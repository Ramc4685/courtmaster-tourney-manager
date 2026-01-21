
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tournament, Match } from '@/types/tournament';
import { Court } from '@/types/entities';
import {
  CalendarDays,
  Clock,
  MapPin,
  Search,
  Trophy,
  Users,
  Wifi,
  WifiOff,
  RefreshCw,
  Maximize,
  Minimize,
  Volume2,
  VolumeX,
  Filter,
  ChevronDown,
  ChevronUp,
  Star,
  Medal,
  Activity,
  TrendingUp,
  Zap,
  Timer,
  Target,
  BarChart3,
  Play,
  Pause
} from 'lucide-react';
import { format, formatDistanceToNow, parseISO, isFuture, isPast } from 'date-fns';
import { cn } from '@/lib/utils';
import { subscribeToMatches, subscribeToCollection, COLLECTIONS } from '@/lib/appwrite';
import { useMobileOptimization } from '@/hooks/useMobileOptimization';

interface TournamentPublicViewProps {
  tournament: Tournament;
  upcomingMatches: Match[];
  announcements: { id: string; title: string; content: string; date: string }[];
  completedMatches?: Match[];
  courts?: Court[];
  standings?: Array<{
    id: string;
    name: string;
    wins: number;
    losses: number;
    matchesPlayed: number;
    setsWon: number;
    setsLost: number;
    pointsFor: number;
    pointsAgainst: number;
    rank: number;
  }>;
  liveMatches?: Match[];
  onMatchUpdate?: (match: Match) => void;
  isFullScreen?: boolean;
  onToggleFullScreen?: () => void;
}

interface LiveScoreUpdate {
  matchId: string;
  score: { team1: number; team2: number; set: number };
  timestamp: number;
}

interface TournamentStats {
  totalMatches: number;
  completedMatches: number;
  activeCourts: number;
  totalParticipants: number;
  avgMatchDuration: number;
  tournamentProgress: number;
}

export const TournamentPublicView: React.FC<TournamentPublicViewProps> = ({
  tournament,
  upcomingMatches,
  announcements,
  completedMatches = [],
  courts = [],
  standings = [],
  liveMatches = [],
  onMatchUpdate,
  isFullScreen = false,
  onToggleFullScreen
}) => {
  // State management
  const [activeTab, setActiveTab] = useState('schedule');
  const [isAutoRefresh, setIsAutoRefresh] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(Date.now());
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'live' | 'upcoming' | 'completed'>('all');
  const [isMuted, setIsMuted] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['live', 'upcoming']));
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [liveScoreUpdates, setLiveScoreUpdates] = useState<LiveScoreUpdate[]>([]);

  // Development flag for mock features
  const isDevelopment = import.meta.env.DEV;

  // Mobile optimization hook
  const { getOptimalRefreshRate, capabilities: { hasReducedMotion } } = useMobileOptimization();

  // Auto-refresh and online status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Real-time subscriptions for matches and announcements
  useEffect(() => {
    if (!isAutoRefresh) return;

    let matchUnsubscribe: (() => void) | null = null;
    let announcementUnsubscribe: (() => void) | null = null;

    // Subscribe to matches for this tournament
    if (tournament.id) {
      matchUnsubscribe = subscribeToMatches(tournament.id, (response) => {
        console.log('Match update received:', response);
        setLastUpdate(Date.now());

        // In a real implementation, update the local match state here
        // For now, we'll just trigger a refresh
        if (onMatchUpdate && response.payload) {
          onMatchUpdate(response.payload);
        }

        // Create score update for live score feed
        if (response.payload && liveMatches.some(m => m.id === response.payload.$id)) {
          const update: LiveScoreUpdate = {
            matchId: response.payload.$id,
            score: response.payload.scores?.sets?.[0] || {
              team1: response.payload.scores?.team1 || 0,
              team2: response.payload.scores?.team2 || 0,
              set: 1
            },
            timestamp: Date.now()
          };

          setLiveScoreUpdates(prev => [update, ...prev.slice(0, 9)]);

          // Play notification sound (if not muted)
          if (!isMuted && typeof Audio !== 'undefined') {
            console.log('Score update notification');
          }
        }
      });

      // Subscribe to announcements
      announcementUnsubscribe = subscribeToCollection(COLLECTIONS.ANNOUNCEMENTS, (response) => {
        console.log('Announcement update received:', response);
        setLastUpdate(Date.now());
        // In a real implementation, update announcements state here
      });
    }

    // Fallback auto-refresh for when subscriptions fail
    const refreshRate = getOptimalRefreshRate();
    const fallbackInterval = setInterval(() => {
      setLastUpdate(Date.now());
      console.log('Fallback refresh triggered');
    }, refreshRate);

    return () => {
      if (matchUnsubscribe) matchUnsubscribe();
      if (announcementUnsubscribe) announcementUnsubscribe();
      clearInterval(fallbackInterval);
    };
  }, [isAutoRefresh, tournament.id, onMatchUpdate, liveMatches, isMuted]);

  // Mock live score updates for development only
  useEffect(() => {
    if (!isDevelopment || !isAutoRefresh) return;

    const mockInterval = setInterval(() => {
      if (liveMatches.length > 0) {
        const randomMatch = liveMatches[Math.floor(Math.random() * liveMatches.length)];
        const update: LiveScoreUpdate = {
          matchId: randomMatch.id,
          score: {
            team1: Math.floor(Math.random() * 21),
            team2: Math.floor(Math.random() * 21),
            set: Math.floor(Math.random() * 3) + 1
          },
          timestamp: Date.now()
        };

        setLiveScoreUpdates(prev => [update, ...prev.slice(0, 9)]);

        if (!isMuted) {
          console.log('Mock score update notification');
        }
      }
    }, 15000); // Every 15 seconds in development

    return () => clearInterval(mockInterval);
  }, [isDevelopment, isAutoRefresh, liveMatches, isMuted]);

  // Memoized tournament statistics
  const tournamentStats = useMemo((): TournamentStats => {
    const totalMatches = upcomingMatches.length + completedMatches.length + liveMatches.length;
    const activeCourts = courts.filter(court =>
      liveMatches.some(match => match.court?.id === court.id)
    ).length;

    // Calculate average match duration (mock implementation)
    const avgDuration = completedMatches.length > 0
      ? completedMatches.reduce((acc, match) => {
          if (match.end_time && match.start_time) {
            return acc + (new Date(match.end_time).getTime() - new Date(match.start_time).getTime());
          }
          return acc + (45 * 60 * 1000); // Default 45 minutes
        }, 0) / completedMatches.length / 60000 // Convert to minutes
      : 45;

    const progress = totalMatches > 0 ? (completedMatches.length / totalMatches) * 100 : 0;

    return {
      totalMatches,
      completedMatches: completedMatches.length,
      activeCourts,
      totalParticipants: standings.length,
      avgMatchDuration: Math.round(avgDuration),
      tournamentProgress: Math.round(progress)
    };
  }, [upcomingMatches, completedMatches, liveMatches, courts, standings]);

  // Filtered and searched matches
  const filteredMatches = useMemo(() => {
    let matches: Match[] = [];

    switch (selectedFilter) {
      case 'live':
        matches = liveMatches;
        break;
      case 'upcoming':
        matches = upcomingMatches;
        break;
      case 'completed':
        matches = completedMatches;
        break;
      default:
        matches = [...liveMatches, ...upcomingMatches, ...completedMatches];
    }

    if (searchTerm) {
      matches = matches.filter(match =>
        match.team1?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        match.team2?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        match.court?.name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return matches;
  }, [liveMatches, upcomingMatches, completedMatches, selectedFilter, searchTerm]);

  // Helper to handle non-standard match field names
  const getScheduledISO = (m: Match) => (m as any).scheduled_time || (m as any).scheduledTime || null;

  // Utility functions
  const toggleSection = (sectionId: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId);
    } else {
      newExpanded.add(sectionId);
    }
    setExpandedSections(newExpanded);
  };

  const handleRefresh = useCallback(() => {
    setLastUpdate(Date.now());
    // In real implementation, this would trigger data refresh
    console.log('Refreshing tournament data...');
  }, []);

  const getMatchStatus = (match: Match): { status: string; color: string; icon: React.ReactNode } => {
    if (liveMatches.some(m => m.id === match.id)) {
      return {
        status: 'Live',
        color: 'bg-red-500 text-white',
        icon: <Zap className="h-3 w-3" />
      };
    }

    const iso = getScheduledISO(match);
    if (iso && isFuture(parseISO(iso))) {
      return {
        status: 'Upcoming',
        color: 'bg-blue-500 text-white',
        icon: <Clock className="h-3 w-3" />
      };
    }

    if (match.status === 'completed') {
      return {
        status: 'Completed',
        color: 'bg-green-500 text-white',
        icon: <Trophy className="h-3 w-3" />
      };
    }

    return {
      status: 'Scheduled',
      color: 'bg-gray-500 text-white',
      icon: <CalendarDays className="h-3 w-3" />
    };
  };

  const formatMatchTime = (match: Match): string => {
    const iso = getScheduledISO(match);
    if (iso) {
      const time = parseISO(iso);
      if (isFuture(time)) {
        return formatDistanceToNow(time, { addSuffix: true });
      }
      return format(time, 'HH:mm');
    }
    return 'TBD';
  };

  // Enhanced Match Card Component
  const MatchCard = ({ match, showScore = false }: { match: Match; showScore?: boolean }) => {
    const { status, color, icon } = getMatchStatus(match);
    const timeDisplay = formatMatchTime(match);
    const latestScore = liveScoreUpdates.find(update => update.matchId === match.id);

    return (
      <Card className={cn(
        "hover:shadow-md transition-all duration-300",
        liveMatches.some(m => m.id === match.id) && "ring-2 ring-red-500 ring-opacity-50",
        liveMatches.some(m => m.id === match.id) && !hasReducedMotion && "animate-pulse"
      )}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <Badge className={cn(color, "flex items-center gap-1")}>
              {icon}
              {status}
            </Badge>
            <div className="text-sm text-muted-foreground">{timeDisplay}</div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="font-semibold">
                {match.team1?.name || 'Team 1'}
              </div>
              {latestScore && (
                <div className="text-lg font-bold text-red-600">
                  {latestScore.score.team1}
                </div>
              )}
            </div>
            <div className="text-center text-xs text-muted-foreground">vs</div>
            <div className="flex items-center justify-between">
              <div className="font-semibold">
                {match.team2?.name || 'Team 2'}
              </div>
              {latestScore && (
                <div className="text-lg font-bold text-red-600">
                  {latestScore.score.team2}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between mt-3 pt-3 border-t">
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <MapPin className="h-3 w-3" />
              {match.court?.name || `Court ${match.court?.number || 'TBD'}`}
            </div>
            {match.round_number && (
              <div className="text-sm text-muted-foreground">
                Round {match.round_number}
              </div>
            )}
          </div>

          {showScore && match.scores && (
            <div className="mt-3 pt-3 border-t">
              <div className="text-sm font-medium">Final Score</div>
              <div className="text-lg">
                {/* Render match scores here */}
                {match.winner_id === match.team1?.id ? '✓' : ''} {match.team1?.name}
                vs
                {match.winner_id === match.team2?.id ? '✓' : ''} {match.team2?.name}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  // Tournament Progress Component
  const TournamentProgress = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Tournament Progress
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex justify-between text-sm">
            <span>Matches Completed</span>
            <span>{tournamentStats.completedMatches}/{tournamentStats.totalMatches}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className="bg-green-500 h-3 rounded-full transition-all duration-1000"
              style={{ width: `${tournamentStats.tournamentProgress}%` }}
            />
          </div>
          <div className="text-xs text-center text-muted-foreground">
            {tournamentStats.tournamentProgress}% Complete
          </div>
        </div>
      </CardContent>
    </Card>
  );

  // Live Score Updates Component
  const LiveScoreUpdates = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="h-5 w-5 text-red-500" />
          Live Score Updates
          {liveScoreUpdates.length > 0 && (
            <Badge variant="secondary" className="ml-auto">
              {liveScoreUpdates.length}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="max-h-48 overflow-y-auto">
        {liveScoreUpdates.length === 0 ? (
          <p className="text-muted-foreground text-sm">No live updates yet</p>
        ) : (
          <div className="space-y-2">
            {liveScoreUpdates.slice(0, 5).map((update, index) => (
              <div
                key={`${update.matchId}-${update.timestamp}`}
                className={cn(
                  "flex justify-between items-center p-2 rounded-md text-sm",
                  index === 0 ? "bg-red-50 border border-red-200" : "bg-muted"
                )}
              >
                <span className="font-medium">Set {update.score.set}</span>
                <span className="text-red-600 font-bold">
                  {update.score.team1} - {update.score.team2}
                </span>
                <span className="text-xs text-muted-foreground">
                  {formatDistanceToNow(update.timestamp, { addSuffix: true })}
                </span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );

  // Tournament Statistics Component
  const TournamentStatistics = () => (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <Card>
        <CardContent className="p-4 text-center">
          <div className="text-2xl font-bold">{tournamentStats.totalMatches}</div>
          <div className="text-sm text-muted-foreground">Total Matches</div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4 text-center">
          <div className="text-2xl font-bold text-green-600">{tournamentStats.activeCourts}</div>
          <div className="text-sm text-muted-foreground">Active Courts</div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4 text-center">
          <div className="text-2xl font-bold">{tournamentStats.totalParticipants}</div>
          <div className="text-sm text-muted-foreground">Participants</div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4 text-center">
          <div className="text-2xl font-bold">{tournamentStats.avgMatchDuration}m</div>
          <div className="text-sm text-muted-foreground">Avg Duration</div>
        </CardContent>
      </Card>
    </div>
  );

  // Enhanced Standings Component
  const StandingsTable = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5" />
          Tournament Standings
        </CardTitle>
      </CardHeader>
      <CardContent>
        {standings.length === 0 ? (
          <p className="text-muted-foreground">Standings will be available when matches are completed</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Rank</th>
                  <th className="text-left p-2">Team/Player</th>
                  <th className="text-center p-2">W-L</th>
                  <th className="text-center p-2">Sets</th>
                  <th className="text-center p-2">Points</th>
                </tr>
              </thead>
              <tbody>
                {standings.slice(0, 10).map((team) => (
                  <tr key={team.id} className="border-b hover:bg-muted/50">
                    <td className="p-2">
                      <div className="flex items-center gap-2">
                        {team.rank <= 3 && (
                          <Medal className={cn(
                            "h-4 w-4",
                            team.rank === 1 && "text-yellow-500",
                            team.rank === 2 && "text-gray-400",
                            team.rank === 3 && "text-amber-600"
                          )} />
                        )}
                        #{team.rank}
                      </div>
                    </td>
                    <td className="p-2 font-medium">{team.name}</td>
                    <td className="p-2 text-center">{team.wins}-{team.losses}</td>
                    <td className="p-2 text-center">{team.setsWon}-{team.setsLost}</td>
                    <td className="p-2 text-center">{team.pointsFor}-{team.pointsAgainst}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className={cn(
      "min-h-screen bg-background",
      isFullScreen && "fixed inset-0 z-50 overflow-auto"
    )}>
      {/* Header with controls */}
      <div className="bg-background border-b sticky top-0 z-40">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div>
              <h1 className={cn(
                "font-bold",
                isFullScreen ? "text-2xl" : "text-xl sm:text-2xl"
              )}>
                {tournament.name}
              </h1>
              <p className="text-sm text-muted-foreground">
                {tournament.startDate && format(parseISO(tournament.startDate), 'PP')}
                {tournament.endDate && ` - ${format(parseISO(tournament.endDate), 'PP')}`}
              </p>
            </div>

            <div className="flex items-center gap-2">
              {/* Connection status */}
              {isOnline ? (
                <Wifi className="h-4 w-4 text-green-500" />
              ) : (
                <WifiOff className="h-4 w-4 text-red-500" />
              )}

              {/* Sound toggle */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsMuted(!isMuted)}
                className="min-h-[44px] min-w-[44px]"
              >
                {isMuted ? (
                  <VolumeX className="h-4 w-4" />
                ) : (
                  <Volume2 className="h-4 w-4" />
                )}
              </Button>

              {/* Auto-refresh toggle */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsAutoRefresh(!isAutoRefresh)}
                className="min-h-[44px] min-w-[44px]"
              >
                {isAutoRefresh ? (
                  <Play className="h-4 w-4 text-green-500" />
                ) : (
                  <Pause className="h-4 w-4" />
                )}
              </Button>

              {/* Manual refresh */}
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRefresh}
                className="min-h-[44px] min-w-[44px]"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>

              {/* Full screen toggle */}
              {onToggleFullScreen && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onToggleFullScreen}
                  className="min-h-[44px] min-w-[44px]"
                >
                  {isFullScreen ? (
                    <Minimize className="h-4 w-4" />
                  ) : (
                    <Maximize className="h-4 w-4" />
                  )}
                </Button>
              )}
            </div>
          </div>

          {/* Last update timestamp */}
          <div className="text-xs text-muted-foreground mt-1">
            Last updated: {format(lastUpdate, 'HH:mm:ss')}
          </div>
        </div>
      </div>

      {/* Tournament Statistics Overview */}
      <div className="container mx-auto px-4 py-4">
        <TournamentStatistics />
      </div>

      {/* Main Content Tabs */}
      <div className="container mx-auto px-4">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="live" className="flex items-center gap-1">
              <Zap className="h-3 w-3" />
              Live
            </TabsTrigger>
            <TabsTrigger value="schedule" className="flex items-center gap-1">
              <CalendarDays className="h-3 w-3" />
              Schedule
            </TabsTrigger>
            <TabsTrigger value="results" className="flex items-center gap-1">
              <Trophy className="h-3 w-3" />
              Results
            </TabsTrigger>
            <TabsTrigger value="standings" className="flex items-center gap-1">
              <Medal className="h-3 w-3" />
              Standings
            </TabsTrigger>
          </TabsList>

          {/* Live Tab */}
          <TabsContent value="live" className="space-y-6 mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-4">
                {/* Live Matches */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Zap className="h-5 w-5 text-red-500" />
                      Live Matches
                      {liveMatches.length > 0 && (
                        <Badge variant="destructive">{liveMatches.length}</Badge>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {liveMatches.length === 0 ? (
                      <p className="text-muted-foreground">No live matches at the moment</p>
                    ) : (
                      <div className="grid gap-4">
                        {liveMatches.map(match => (
                          <MatchCard key={match.id} match={match} />
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Tournament Progress */}
                <TournamentProgress />
              </div>

              <div className="space-y-4">
                {/* Live Score Updates */}
                <LiveScoreUpdates />

                {/* Court Status */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Activity className="h-5 w-5" />
                      Court Status
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {courts.slice(0, 6).map(court => {
                        const isActive = liveMatches.some(match => match.court?.id === court.id);
                        return (
                          <div
                            key={court.id}
                            className="flex items-center justify-between p-2 rounded-md bg-muted"
                          >
                            <span className="font-medium">{court.name}</span>
                            <Badge
                              variant={isActive ? "destructive" : "secondary"}
                              className="flex items-center gap-1"
                            >
                              <div className={cn(
                                "w-2 h-2 rounded-full",
                                isActive ? "bg-red-500" : "bg-gray-400"
                              )} />
                              {isActive ? 'In Use' : 'Available'}
                            </Badge>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Schedule Tab */}
          <TabsContent value="schedule" className="space-y-6 mt-6">
            {/* Search and Filter */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search matches, teams, or courts..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex gap-2">
                {(['all', 'live', 'upcoming', 'completed'] as const).map(filter => (
                  <Button
                    key={filter}
                    variant={selectedFilter === filter ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedFilter(filter)}
                    className="capitalize"
                  >
                    {filter}
                  </Button>
                ))}
              </div>
            </div>

            {/* Matches Grid */}
            {filteredMatches.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center text-muted-foreground">
                  <CalendarDays className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No matches found matching your criteria</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredMatches.map(match => (
                  <MatchCard key={match.id} match={match} />
                ))}
              </div>
            )}

            {/* Announcements */}
            <Card>
              <CardHeader>
                <CardTitle>Tournament Announcements</CardTitle>
              </CardHeader>
              <CardContent>
                {announcements.length === 0 ? (
                  <p className="text-muted-foreground">No announcements</p>
                ) : (
                  <div className="space-y-4">
                    {announcements.map(announcement => (
                      <div key={announcement.id} className="border-b pb-4 last:border-b-0">
                        <h3 className="font-medium">{announcement.title}</h3>
                        <p className="text-sm mt-1">{announcement.content}</p>
                        <p className="text-xs text-muted-foreground mt-2">
                          {format(parseISO(announcement.date), 'PPp')}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Results Tab */}
          <TabsContent value="results" className="space-y-6 mt-6">
            {completedMatches.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center text-muted-foreground">
                  <Trophy className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No completed matches yet</p>
                  <p className="text-sm mt-1">Results will appear here as matches are completed</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {completedMatches.map(match => (
                  <MatchCard key={match.id} match={match} showScore={true} />
                ))}
              </div>
            )}
          </TabsContent>

          {/* Standings Tab */}
          <TabsContent value="standings" className="space-y-6 mt-6">
            <StandingsTable />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};
