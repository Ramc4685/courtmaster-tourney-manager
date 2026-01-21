import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  RefreshCw,
  Clock,
  MapPin,
  Trophy,
  Users,
  Play,
  Square,
  CheckCircle,
  Maximize,
  AlertCircle,
  Wifi,
  WifiOff
} from 'lucide-react';
import { matchService } from '../../services/tournament/MatchService';
import { tournamentService } from '../../services/tournament/TournamentService';
import { realtimeTournamentService } from '../../services/realtime/RealtimeTournamentService';
import eventBus, { EventType } from '@/events/eventBus';
import { AnnouncementBanner } from './AnnouncementBanner';
import type { Tournament } from '@/types/tournament';

interface LiveMatch {
  id: string;
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  sets?: Array<{
    homeScore: number;
    awayScore: number;
  }>;
  status: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED';
  court: string;
  courtId?: string;
  round: string;
  category: string;
  startTime?: Date;
  scheduledTime?: Date;
  endTime?: Date;
  estimatedDuration?: number;
  lastUpdate?: Date;
  lastScoreUpdate?: Date;
}

interface LiveScoreboardProps {
  tournamentId: string;
  tournament?: Tournament;
  refreshInterval?: number;
  showCompleted?: boolean;
  maxMatches?: number;
  fullScreen?: boolean;
  spectatorMode?: boolean;
}

export const LiveScoreboard: React.FC<LiveScoreboardProps> = ({
  tournamentId,
  tournament,
  refreshInterval = 30000,
  showCompleted = true,
  maxMatches = 10,
  fullScreen = false,
  spectatorMode = false
}) => {
  const [matches, setMatches] = useState<LiveMatch[]>([]);
  const [tournamentData, setTournamentData] = useState<Tournament | null>(tournament || null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [isConnected, setIsConnected] = useState(true);
  const [recentScoreUpdates, setRecentScoreUpdates] = useState<string[]>([]);
  const [currentMatchIndex, setCurrentMatchIndex] = useState(0);

  const autoScrollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const mountedRef = useRef(true);

  const fetchMatches = useCallback(async () => {
    if (!mountedRef.current) return;

    setLoading(true);
    setError(null);

    try {
      // Fetch tournament data if not provided
      if (!tournamentData) {
        const tournament = await tournamentService.getTournament(tournamentId);
        if (mountedRef.current) {
          setTournamentData(tournament);
        }
      }

      // Fetch matches from different statuses
      const [inProgressMatches, scheduledMatches, completedMatches] = await Promise.all([
        matchService.getMatchesByStatus(tournamentId, 'IN_PROGRESS'),
        matchService.getMatchesByStatus(tournamentId, 'SCHEDULED'),
        showCompleted ? matchService.getMatchesByStatus(tournamentId, 'COMPLETED') : Promise.resolve([])
      ]);

      // Combine and process matches
      let allMatches = [...inProgressMatches, ...scheduledMatches];
      if (showCompleted) {
        // Limit completed matches to recent ones
        const recentCompleted = completedMatches
          .filter(match => match.endTime && Date.now() - match.endTime.getTime() < 3600000) // Last hour
          .slice(0, 3);
        allMatches = [...allMatches, ...recentCompleted];
      }

      // Transform to LiveMatch format
      const liveMatches: LiveMatch[] = allMatches.map(match => {
        const court = tournamentData?.courts?.find(c => c.id === match.courtId);

        return {
          id: match.id,
          homeTeam: match.homeTeam?.name || 'TBD',
          awayTeam: match.awayTeam?.name || 'TBD',
          homeScore: match.homeScore || 0,
          awayScore: match.awayScore || 0,
          sets: match.sets?.map(set => ({
            homeScore: set.homeScore || 0,
            awayScore: set.awayScore || 0
          })),
          status: match.status as 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED',
          court: court?.name || 'TBD',
          courtId: match.courtId,
          round: match.round || 'Tournament',
          category: match.category || 'General',
          startTime: match.startTime ? new Date(match.startTime) : undefined,
          scheduledTime: match.scheduledTime ? new Date(match.scheduledTime) : undefined,
          endTime: match.endTime ? new Date(match.endTime) : undefined,
          estimatedDuration: match.estimatedDuration || 45,
          lastUpdate: match.updatedAt ? new Date(match.updatedAt) : undefined,
          lastScoreUpdate: match.lastScoreUpdate ? new Date(match.lastScoreUpdate) : undefined
        };
      });

      // Sort matches: in-progress first, then scheduled, then completed
      liveMatches.sort((a, b) => {
        const statusOrder = { 'IN_PROGRESS': 0, 'SCHEDULED': 1, 'COMPLETED': 2 };
        if (statusOrder[a.status] !== statusOrder[b.status]) {
          return statusOrder[a.status] - statusOrder[b.status];
        }

        // Within same status, sort by start time
        const getComparableTime = (match: LiveMatch) => {
          if (match.status === 'SCHEDULED') {
            return match.scheduledTime?.getTime() || match.startTime?.getTime() || 0;
          }
          return match.startTime?.getTime() || match.scheduledTime?.getTime() || 0;
        };

        const aTime = getComparableTime(a);
        const bTime = getComparableTime(b);
        return aTime - bTime;
      });

      // Apply max matches limit
      const limitedMatches = maxMatches ? liveMatches.slice(0, maxMatches) : liveMatches;

      if (mountedRef.current) {
        setMatches(limitedMatches);
        setLastRefresh(new Date());
        setIsConnected(true);
      }
    } catch (err) {
      console.error('Error fetching matches:', err);
      if (mountedRef.current) {
        setError('Failed to load live matches');
        setIsConnected(false);
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, [tournamentId, tournamentData, showCompleted, maxMatches]);

  // Auto-scroll for spectator mode
  const setupAutoScroll = useCallback(() => {
    if (!spectatorMode || matches.length <= 1) return;

    if (autoScrollIntervalRef.current) {
      clearInterval(autoScrollIntervalRef.current);
    }

    autoScrollIntervalRef.current = setInterval(() => {
      setCurrentMatchIndex(prev => (prev + 1) % matches.length);
    }, 10000); // Switch every 10 seconds
  }, [spectatorMode, matches.length]);

  // Real-time subscriptions
  useEffect(() => {
    if (!tournamentId) return;

    // Subscribe to tournament updates
    const unsubscribeTournament = realtimeTournamentService.subscribeTournament(
      tournamentId,
      (_update) => {
        fetchMatches();
      }
    );

    // Subscribe to match updates
    const unsubscribeMatches = realtimeTournamentService.subscribeInProgressMatches(
      tournamentId,
      () => {
        fetchMatches();
      }
    );

    return () => {
      unsubscribeTournament?.();
      unsubscribeMatches?.();
    };
  }, [tournamentId, fetchMatches]);

  // Event bus subscriptions
  useEffect(() => {
    const handleScoreUpdate = (data: any) => {
      if (data.tournamentId === tournamentId) {
        // Add visual indication of score update
        setRecentScoreUpdates(prev => [...prev.slice(-2), data.matchId]);
        setTimeout(() => {
          setRecentScoreUpdates(prev => prev.filter(id => id !== data.matchId));
        }, 3000);

        fetchMatches();
      }
    };

    const handleMatchUpdate = (data: any) => {
      if (data.tournamentId === tournamentId) {
        fetchMatches();
      }
    };

    eventBus.on(EventType.SCORE_UPDATED, handleScoreUpdate);
    eventBus.on(EventType.MATCH_STARTED, handleMatchUpdate);
    eventBus.on(EventType.MATCH_COMPLETED, handleMatchUpdate);

    return () => {
      eventBus.off(EventType.SCORE_UPDATED, handleScoreUpdate);
      eventBus.off(EventType.MATCH_STARTED, handleMatchUpdate);
      eventBus.off(EventType.MATCH_COMPLETED, handleMatchUpdate);
    };
  }, [tournamentId, fetchMatches]);

  // Initial load
  useEffect(() => {
    fetchMatches();
  }, [fetchMatches]);

  // Auto refresh polling
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      fetchMatches();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, fetchMatches]);

  // Auto-scroll setup
  useEffect(() => {
    setupAutoScroll();
    return () => {
      if (autoScrollIntervalRef.current) {
        clearInterval(autoScrollIntervalRef.current);
      }
    };
  }, [setupAutoScroll]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false;
      if (autoScrollIntervalRef.current) {
        clearInterval(autoScrollIntervalRef.current);
      }
    };
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'IN_PROGRESS': return <Play className="h-4 w-4 text-green-600" />;
      case 'SCHEDULED': return <Clock className="h-4 w-4 text-blue-600" />;
      case 'COMPLETED': return <CheckCircle className="h-4 w-4 text-gray-600" />;
      default: return <Square className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'IN_PROGRESS': return <Badge className="bg-green-100 text-green-800 animate-pulse">LIVE</Badge>;
      case 'SCHEDULED': return <Badge variant="outline">Scheduled</Badge>;
      case 'COMPLETED': return <Badge variant="secondary">Completed</Badge>;
      default: return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    }).format(date);
  };

  const getMatchTime = (match: LiveMatch) => {
    if (match.status === 'COMPLETED' && match.endTime) {
      return `Completed at ${formatTime(match.endTime)}`;
    }
    if (match.status === 'IN_PROGRESS' && match.startTime) {
      const elapsed = Math.floor((Date.now() - match.startTime.getTime()) / 60000);
      return `Started ${elapsed} min ago`;
    }
    if (match.status === 'SCHEDULED' && match.scheduledTime) {
      return `Starts at ${formatTime(match.scheduledTime)}`;
    }
    return '';
  };

  const enterFullScreen = () => {
    if (document.documentElement.requestFullscreen) {
      document.documentElement.requestFullscreen();
    }
  };

  const getMatchWinner = (match: LiveMatch) => {
    if (match.status !== 'COMPLETED') return null;
    return match.homeScore > match.awayScore ? match.homeTeam : match.awayTeam;
  };

  const isMatchRecentlyUpdated = (matchId: string) => {
    return recentScoreUpdates.includes(matchId);
  };

  if (loading && matches.length === 0) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Spinner className="h-8 w-8" />
          <span className="ml-2">Loading live scores...</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={`space-y-4 ${fullScreen ? 'p-6' : ''}`}>
      {/* Announcement Banner */}
      <AnnouncementBanner tournamentId={tournamentId} />

      {/* Error State */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Trophy className="h-6 w-6 text-primary" />
              <div>
                <CardTitle className={`${fullScreen ? 'text-2xl' : 'text-xl'}`}>
                  Live Scoreboard
                </CardTitle>
                <CardDescription className={fullScreen ? 'text-lg' : undefined}>
                  {tournamentData?.name || `Tournament ${tournamentId}`} • Live Updates
                </CardDescription>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {/* Connection Status */}
              <div className="flex items-center space-x-1">
                {isConnected ? (
                  <Wifi className="h-4 w-4 text-green-600" />
                ) : (
                  <WifiOff className="h-4 w-4 text-red-600" />
                )}
                <span className={`text-xs ${isConnected ? 'text-green-600' : 'text-red-600'}`}>
                  {isConnected ? 'Connected' : 'Disconnected'}
                </span>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setAutoRefresh(!autoRefresh)}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${autoRefresh && !loading ? 'animate-spin' : ''}`} />
                {autoRefresh ? 'Auto' : 'Manual'}
              </Button>

              <Button variant="outline" size="sm" onClick={fetchMatches} disabled={loading}>
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              </Button>

              {!fullScreen && (
                <Button variant="outline" size="sm" onClick={enterFullScreen}>
                  <Maximize className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
          <div className="text-xs text-muted-foreground">
            Last updated: {lastRefresh.toLocaleTimeString()}
            {spectatorMode && matches.length > 1 && (
              <span className="ml-4">
                Auto-scrolling through {matches.length} matches
              </span>
            )}
          </div>
        </CardHeader>
      </Card>

      {/* Live Matches */}
      <div className="space-y-3">
        {(spectatorMode && matches.length > 1 ? [matches[currentMatchIndex]] : matches).map((match, index) => (
          <Card
            key={match.id}
            className={`transition-all duration-300 ${
              match.status === 'IN_PROGRESS'
                ? 'border-green-200 bg-green-50'
                : match.status === 'COMPLETED'
                ? 'border-gray-200 bg-gray-50'
                : ''
            } ${
              isMatchRecentlyUpdated(match.id) ? 'ring-2 ring-blue-500 ring-opacity-50' : ''
            }`}
          >
            <CardContent className={`${fullScreen ? 'p-6' : 'p-4'}`}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  {getStatusIcon(match.status)}
                  <span className={`font-medium ${fullScreen ? 'text-lg' : ''}`}>
                    {match.round}
                  </span>
                  <span className="text-muted-foreground">•</span>
                  <span className={`text-muted-foreground ${fullScreen ? 'text-base' : 'text-sm'}`}>
                    {match.category}
                  </span>
                  <span className="text-muted-foreground">•</span>
                  <div className="flex items-center space-x-1">
                    <MapPin className="h-3 w-3 text-muted-foreground" />
                    <span className={`text-muted-foreground ${fullScreen ? 'text-base' : 'text-sm'}`}>
                      {match.court}
                    </span>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {getStatusBadge(match.status)}
                  <span className={`text-muted-foreground ${fullScreen ? 'text-sm' : 'text-xs'}`}>
                    {getMatchTime(match)}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Teams and Scores */}
                <div className="md:col-span-2 space-y-2">
                  {/* Home Team */}
                  <div className={`flex items-center justify-between p-3 bg-white rounded border transition-all duration-200 ${
                    match.homeScore > match.awayScore && match.status === 'COMPLETED' ? 'border-green-300 bg-green-50' : ''
                  }`}>
                    <div className="flex items-center space-x-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span className={`font-medium ${fullScreen ? 'text-lg' : ''}`}>
                        {match.homeTeam}
                      </span>
                      {match.homeScore > match.awayScore && match.status === 'COMPLETED' && (
                        <Trophy className="h-4 w-4 text-yellow-600" />
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      {match.sets?.map((set, index) => (
                        <span
                          key={index}
                          className={`px-2 py-1 rounded text-sm ${
                            set.homeScore > set.awayScore
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100'
                          } ${fullScreen ? 'text-base px-3 py-2' : ''}`}
                        >
                          {set.homeScore}
                        </span>
                      ))}
                      <span className={`font-bold text-primary ${
                        fullScreen ? 'text-3xl' : 'text-xl'
                      } ${
                        isMatchRecentlyUpdated(match.id) ? 'animate-pulse text-blue-600' : ''
                      }`}>
                        {match.homeScore}
                      </span>
                    </div>
                  </div>

                  {/* Away Team */}
                  <div className={`flex items-center justify-between p-3 bg-white rounded border transition-all duration-200 ${
                    match.awayScore > match.homeScore && match.status === 'COMPLETED' ? 'border-green-300 bg-green-50' : ''
                  }`}>
                    <div className="flex items-center space-x-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span className={`font-medium ${fullScreen ? 'text-lg' : ''}`}>
                        {match.awayTeam}
                      </span>
                      {match.awayScore > match.homeScore && match.status === 'COMPLETED' && (
                        <Trophy className="h-4 w-4 text-yellow-600" />
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      {match.sets?.map((set, index) => (
                        <span
                          key={index}
                          className={`px-2 py-1 rounded text-sm ${
                            set.awayScore > set.homeScore
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100'
                          } ${fullScreen ? 'text-base px-3 py-2' : ''}`}
                        >
                          {set.awayScore}
                        </span>
                      ))}
                      <span className={`font-bold text-primary ${
                        fullScreen ? 'text-3xl' : 'text-xl'
                      } ${
                        isMatchRecentlyUpdated(match.id) ? 'animate-pulse text-blue-600' : ''
                      }`}>
                        {match.awayScore}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Match Info */}
                <div className={`space-y-2 ${fullScreen ? 'text-base' : 'text-sm'}`}>
                  {match.status === 'IN_PROGRESS' && (
                    <div className="bg-green-100 text-green-800 p-3 rounded text-center">
                      <div className="flex items-center justify-center space-x-1">
                        <div className="w-2 h-2 bg-green-600 rounded-full animate-pulse"></div>
                        <span className={`font-medium ${fullScreen ? 'text-lg' : ''}`}>
                          LIVE NOW
                        </span>
                      </div>
                    </div>
                  )}

                  {match.estimatedDuration && (
                    <div className="text-muted-foreground">
                      <Clock className="h-3 w-3 inline mr-1" />
                      Est. {match.estimatedDuration} min
                    </div>
                  )}

                  {match.status === 'COMPLETED' && (
                    <div className="text-center">
                      <Badge variant="secondary" className={fullScreen ? 'text-base px-4 py-2' : ''}>
                        Winner: {getMatchWinner(match)}
                      </Badge>
                    </div>
                  )}

                  {match.status === 'SCHEDULED' && match.startTime && (
                    <div className="text-center">
                      <Badge variant="outline" className={fullScreen ? 'text-base px-4 py-2' : ''}>
                        {formatTime(match.startTime)}
                      </Badge>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {matches.length === 0 && !loading && (
        <Card>
          <CardContent className={`text-center ${fullScreen ? 'py-16' : 'py-8'}`}>
            <Trophy className={`text-muted-foreground mx-auto mb-4 ${fullScreen ? 'h-20 w-20' : 'h-12 w-12'}`} />
            <h3 className={`font-medium mb-2 ${fullScreen ? 'text-2xl' : 'text-lg'}`}>
              No Live Matches
            </h3>
            <p className={`text-muted-foreground ${fullScreen ? 'text-lg' : ''}`}>
              There are currently no matches in progress. Check back later for live updates.
            </p>
            {spectatorMode && (
              <Button
                variant="outline"
                className="mt-4"
                onClick={fetchMatches}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh Now
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Spectator Mode Navigation */}
      {spectatorMode && matches.length > 1 && (
        <div className="flex justify-center items-center space-x-2 py-4">
          {matches.map((_, index) => (
            <div
              key={index}
              className={`w-2 h-2 rounded-full transition-colors ${
                index === currentMatchIndex ? 'bg-primary' : 'bg-gray-300'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
};
