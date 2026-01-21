import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useAuth } from '@/contexts/auth/AuthContext';
import { useTournament } from '@/contexts/tournament/useTournament';
import { matchService, profileService, courtService } from '@/services/api';
import { Match, Profile, Court, MatchScores } from '@/types/entities';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { format, parseISO, isFuture, formatDistanceToNow, addMinutes } from 'date-fns';
import {
  CalendarDays,
  Clock,
  MapPin,
  BarChart2,
  Trophy,
  Percent,
  History,
  RefreshCw,
  Navigation,
  Bell,
  Share2,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  Wifi,
  WifiOff,
  Timer
} from 'lucide-react';
import { subscribeToCollectionFiltered, COLLECTIONS } from '@/lib/appwrite';
import { Badge } from "@/components/ui/badge";
import { cn } from '@/lib/utils';
import { debounce } from 'lodash';
import { useMobileOptimization } from '@/hooks/useMobileOptimization';

const PlayerDashboard: React.FC = () => {
  const { user } = useAuth();
  const { selectedTournament } = useTournament();
  const { getOptimalRefreshRate, getRecommendedTouchTargetSize } = useMobileOptimization();
  const touchTargetSize = getRecommendedTouchTargetSize();
  const [upcomingMatches, setUpcomingMatches] = useState<Match[]>([]);
  const [completedMatches, setCompletedMatches] = useState<Match[]>([]);
  const [isLoadingMatches, setIsLoadingMatches] = useState(false);
  const [errorMatches, setErrorMatches] = useState<string | null>(null);
  const [profileMap, setProfileMap] = useState<Map<string, string>>(new Map());
  const [teamMap, setTeamMap] = useState<Map<string, string>>(new Map());
  const [courtMap, setCourtMap] = useState<Map<string, string>>(new Map());
  // Tournament ID derived from context or player matches
  const tournamentId = useMemo(() => {
    // First try to get from tournament context
    if (selectedTournament?.id) {
      return selectedTournament.id;
    }

    // If no tournament context, derive from player matches if they all share a tournament
    const playerMatches = [...upcomingMatches, ...completedMatches];
    if (playerMatches.length > 0) {
      const tournaments = new Set(playerMatches.map(m => m.tournament_id).filter(Boolean));
      if (tournaments.size === 1) {
        return Array.from(tournaments)[0];
      }
    }

    return null;
  }, [selectedTournament?.id, upcomingMatches, completedMatches]);

  // Mobile optimization state
  const [activeTab, setActiveTab] = useState<'upcoming' | 'history' | 'stats'>('upcoming');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [historyPage, setHistoryPage] = useState(0);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null);

  // Performance optimization refs
  const refreshTimeoutRef = useRef<NodeJS.Timeout>();
  const backgroundRefreshRef = useRef<NodeJS.Timeout>();
  const subscriptionRef = useRef<(() => void) | null>(null);
  const lastFetchRef = useRef<number>(0);

  // Cache management
  const [dataCache, setDataCache] = useState<{
    profiles: Map<string, { data: string; timestamp: number }>;
    courts: Map<string, { data: string; timestamp: number }>;
  }>({
    profiles: new Map(),
    courts: new Map()
  });

  const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
  const HISTORY_PAGE_SIZE = 10;

  // Online status monitoring
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

  // Debounced refresh function
  const debouncedRefresh = useMemo(
    () => debounce(() => {
      if (Date.now() - lastFetchRef.current > 1000) {
        fetchMatchesAndNames();
      }
    }, 300),
    []
  );

  // Cache utilities
  const getCachedProfile = (id: string): string | null => {
    const cached = dataCache.profiles.get(id);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return cached.data;
    }
    return null;
  };

  const setCachedProfile = (id: string, data: string) => {
    setDataCache(prev => ({
      ...prev,
      profiles: new Map(prev.profiles).set(id, { data, timestamp: Date.now() })
    }));
  };

  const getCachedCourt = (id: string): string | null => {
    const cached = dataCache.courts.get(id);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return cached.data;
    }
    return null;
  };

  const setCachedCourt = (id: string, data: string) => {
    setDataCache(prev => ({
      ...prev,
      courts: new Map(prev.courts).set(id, { data, timestamp: Date.now() })
    }));
  };

  // Pull to refresh handler
  const handlePullToRefresh = async () => {
    setIsRefreshing(true);
    try {
      await fetchMatchesAndNames();
    } finally {
      setIsRefreshing(false);
    }
  };

  // Touch gesture handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart({
      x: e.touches[0].clientX,
      y: e.touches[0].clientY
    });
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStart) return;

    const touchEnd = {
      x: e.changedTouches[0].clientX,
      y: e.changedTouches[0].clientY
    };

    const deltaX = touchEnd.x - touchStart.x;
    const deltaY = touchEnd.y - touchStart.y;

    // Swipe gestures for tab navigation
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 50) {
      if (deltaX > 0) {
        // Swipe right - previous tab
        if (activeTab === 'history') setActiveTab('upcoming');
        else if (activeTab === 'stats') setActiveTab('history');
      } else {
        // Swipe left - next tab
        if (activeTab === 'upcoming') setActiveTab('history');
        else if (activeTab === 'history') setActiveTab('stats');
      }
    }

    // Pull to refresh
    if (deltaY > 100 && Math.abs(deltaX) < 50 && window.scrollY === 0) {
      handlePullToRefresh();
    }

    setTouchStart(null);
  };

  const fetchMatchesAndNames = useCallback(async () => {
    if (!user) {
      setUpcomingMatches([]);
      setCompletedMatches([]);
      return;
    }

    // Prevent excessive API calls
    const now = Date.now();
    if (now - lastFetchRef.current < 1000) {
      return;
    }
    lastFetchRef.current = now;

    setIsLoadingMatches(true);
    setErrorMatches(null);

    try {
      const allMatches = await matchService.listMatches({});
      const playerMatches = allMatches.filter(m =>
        (m.player1_id === user.id || m.player2_id === user.id) ||
        false
      );

      const upcoming = playerMatches
        .filter(m => m.status === 'scheduled' && m.scheduled_time && isFuture(parseISO(m.scheduled_time)))
        .sort((a, b) => parseISO(a.scheduled_time!).getTime() - parseISO(b.scheduled_time!).getTime());

      const completed = playerMatches
        .filter(m => m.status === 'completed')
        .sort((a, b) => parseISO(b.end_time || b.updated_at).getTime() - parseISO(a.end_time || a.updated_at).getTime());

      setUpcomingMatches(upcoming);
      setCompletedMatches(completed);

      const allRelevantMatches = [...upcoming, ...completed];
      const playerIds = new Set<string>();
      const teamIds = new Set<string>();
      const courtIds = new Set<string>();

      allRelevantMatches.forEach(m => {
        if (m.player1_id) playerIds.add(m.player1_id);
        if (m.player2_id) playerIds.add(m.player2_id);
        if (m.team1_id) teamIds.add(m.team1_id);
        if (m.team2_id) teamIds.add(m.team2_id);
        if (m.court_id) courtIds.add(m.court_id);
      });

      // Use cached data where available
      const newProfileMap = new Map<string, string>();
      const uncachedPlayerIds: string[] = [];

      playerIds.forEach(id => {
        const cached = getCachedProfile(id);
        if (cached) {
          newProfileMap.set(id, cached);
        } else {
          uncachedPlayerIds.push(id);
        }
      });

      const newCourtMap = new Map<string, string>();
      const needCourtFetch = Array.from(courtIds).some(id => !getCachedCourt(id));

      // Fetch only uncached data
      const promises: Promise<any>[] = [];

      if (uncachedPlayerIds.length > 0) {
        promises.push(
          Promise.all(uncachedPlayerIds.map(id => profileService.getProfile(id)))
            .then(profiles => {
              profiles.forEach(p => {
                const displayName = p.display_name || p.full_name || p.email || 'Unknown Player';
                newProfileMap.set(p.id, displayName);
                setCachedProfile(p.id, displayName);
              });
            })
            .catch(err => console.error("Failed to fetch some profiles:", err))
        );
      }

      if (needCourtFetch) {
        promises.push(
          courtService.listCourts(tournamentId || undefined)
            .then(courts => {
              courts.forEach(c => {
                newCourtMap.set(c.id, c.name);
                setCachedCourt(c.id, c.name);
              });
            })
            .catch(err => console.error("Failed to fetch courts:", err))
        );
      } else {
        // Use all cached court data
        courtIds.forEach(id => {
          const cached = getCachedCourt(id);
          if (cached) {
            newCourtMap.set(id, cached);
          }
        });
      }

      await Promise.allSettled(promises);

      setProfileMap(newProfileMap);
      setCourtMap(newCourtMap);

    } catch (err) {
      console.error("Failed to fetch matches or names:", err);
      setErrorMatches(err instanceof Error ? err.message : 'Failed to load matches');
    } finally {
      setIsLoadingMatches(false);
    }
  }, [user, tournamentId, getCachedProfile, getCachedCourt, setCachedProfile, setCachedCourt]);

  useEffect(() => {
    fetchMatchesAndNames();
  }, [fetchMatchesAndNames]);

  // Optimized subscription management with adaptive background refresh
  useEffect(() => {
    if (!user) return;

    // Cleanup previous subscription and timers
    if (subscriptionRef.current) {
      subscriptionRef.current();
      subscriptionRef.current = null;
    }
    if (backgroundRefreshRef.current) {
      clearInterval(backgroundRefreshRef.current);
      backgroundRefreshRef.current = undefined;
    }

    // Subscribe to match updates using Appwrite with debouncing
    const unsubscribe = subscribeToCollectionFiltered(
      COLLECTIONS.MATCHES,
      null,
      (payload) => payload?.player1_id === user.id || payload?.player2_id === user.id || payload?.team1_id === user.id || payload?.team2_id === user.id,
      (response) => {
        console.log('Received match update response:', response);
        console.log(`Match update relevant to user ${user.id}, debounced refresh...`);
        debouncedRefresh();
      }
    );

    subscriptionRef.current = unsubscribe;

    // Set up adaptive background refresh
    const refreshInterval = getOptimalRefreshRate();
    backgroundRefreshRef.current = setInterval(() => {
      // Only refresh if user is online and not currently loading
      if (isOnline && !isLoadingMatches) {
        const now = Date.now();
        // Prevent excessive calls by checking last fetch time
        if (now - lastFetchRef.current > refreshInterval / 2) {
          console.log('Background refresh triggered');
          fetchMatchesAndNames();
        }
      }
    }, refreshInterval);

    // Initial fetch
    fetchMatchesAndNames();

    return () => {
      if (subscriptionRef.current) {
        subscriptionRef.current();
        subscriptionRef.current = null;
        console.log(`Unsubscribed from player ${user.id} match updates`);
      }
      if (backgroundRefreshRef.current) {
        clearInterval(backgroundRefreshRef.current);
        backgroundRefreshRef.current = undefined;
      }
      // Cancel any pending debounced calls
      debouncedRefresh.cancel();
    };
  }, [user, fetchMatchesAndNames, debouncedRefresh, getOptimalRefreshRate, isOnline, isLoadingMatches]);

  // Memoized data calculations for performance
  const playerStats = useMemo(() => {
    if (!user?.player_stats) {
      return {
        matchesWon: 0,
        matchesPlayed: 0,
        winRate: 0,
        tournamentsWon: 0,
        tournamentsPlayed: 0,
        rating: 'N/A',
        trend: 'stable' as 'up' | 'down' | 'stable'
      };
    }

    const stats = user.player_stats;
    const winRate = (stats.matches_won / (stats.matches_played || 1)) * 100;

    // Calculate trend based on recent performance (mock implementation)
    const recentWins = completedMatches
      .slice(0, 5)
      .filter(m => m.winner_id === user.id).length;
    const trend = recentWins >= 3 ? 'up' : recentWins <= 1 ? 'down' : 'stable';

    return {
      matchesWon: stats.matches_won || 0,
      matchesPlayed: stats.matches_played || 0,
      winRate: Number(winRate.toFixed(1)),
      tournamentsWon: stats.tournaments_won || 0,
      tournamentsPlayed: stats.tournaments_played || 0,
      rating: stats.rating || 'N/A',
      trend
    };
  }, [user?.player_stats, completedMatches]);

  // Memoized paginated match history
  const paginatedHistory = useMemo(() => {
    const startIndex = historyPage * HISTORY_PAGE_SIZE;
    const endIndex = startIndex + HISTORY_PAGE_SIZE;
    return completedMatches.slice(startIndex, endIndex);
  }, [completedMatches, historyPage]);

  const hasMoreHistory = useMemo(() => {
    return (historyPage + 1) * HISTORY_PAGE_SIZE < completedMatches.length;
  }, [completedMatches.length, historyPage]);

  // Load more history handler
  const loadMoreHistory = () => {
    if (hasMoreHistory && !isLoadingMore) {
      setIsLoadingMore(true);
      setTimeout(() => {
        setHistoryPage(prev => prev + 1);
        setIsLoadingMore(false);
      }, 500); // Simulate loading delay
    }
  };

  // Quick action handlers
  const handleGetDirections = (match: Match) => {
    if (match.court_id) {
      const courtName = courtMap.get(match.court_id) || 'Court';
      // This would typically open a maps app
      console.log(`Getting directions to ${courtName}`);
    }
  };

  const handleSetReminder = (match: Match) => {
    if (match.scheduled_time) {
      // This would typically set a device reminder
      console.log(`Setting reminder for match at ${match.scheduled_time}`);
    }
  };

  const handleShareMatch = (match: Match) => {
    const opponent = renderOpponent(match);
    const time = match.scheduled_time
      ? format(parseISO(match.scheduled_time), 'PPp')
      : 'TBD';
    const shareText = `My upcoming match vs ${opponent} on ${time}`;

    if (navigator.share) {
      navigator.share({ text: shareText });
    } else {
      navigator.clipboard.writeText(shareText);
      console.log('Match details copied to clipboard');
    }
  };

  const renderOpponent = (match: Match) => {
     let opponentName = 'TBD';
     if (match.player1_id && match.player2_id) {
        const opponentId = match.player1_id === user?.id ? match.player2_id : match.player1_id;
        opponentName = profileMap.get(opponentId) || `Player ID: ${opponentId}`;
     } else if (match.team1_id && match.team2_id) {
        opponentName = 'Team Opponent';
     } 
     return opponentName;
  }

  const renderCourt = (courtId: string | null) => {
      if (!courtId) return 'Court TBD';
      return courtMap.get(courtId) || `Court ID: ${courtId}`;
  }

  const renderScore = (scores: MatchScores | null) => {
      if (!scores) return 'N/A';
      return scores.sets.map(s => `${s.team1}-${s.team2}`).join(', ');
  };

  // Enhanced Match Card Component
  const MatchCard = ({ match, isUpcoming = false }: { match: Match; isUpcoming?: boolean }) => {
    const opponent = renderOpponent(match);
    const courtName = renderCourt(match.court_id);
    const isWon = match.winner_id === user?.id;

    return (
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="font-semibold text-lg">vs. {opponent}</p>
              <p className="text-sm text-muted-foreground">
                Round {match.round_number} - Match {match.match_number}
              </p>
            </div>
            {!isUpcoming && (
              <Badge
                variant={isWon ? "default" : "destructive"}
                className={cn(
                  isWon ? "bg-green-500 hover:bg-green-600" : "",
                  "ml-2"
                )}
              >
                {isWon ? 'Win' : 'Loss'}
              </Badge>
            )}
          </div>

          {isUpcoming && match.scheduled_time && (
            <div className="flex items-center gap-2 text-green-600 bg-green-50 p-2 rounded-md">
              <Timer className="h-4 w-4" />
              <span className="text-sm font-medium">
                {formatDistanceToNow(parseISO(match.scheduled_time), { addSuffix: true })}
              </span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-sm">
            <div className="flex items-center gap-1">
              <CalendarDays className="h-4 w-4 text-muted-foreground" />
              <span>
                {match.scheduled_time
                  ? format(parseISO(match.scheduled_time), 'P')
                  : isUpcoming
                  ? 'Date TBD'
                  : format(parseISO(match.end_time || match.updated_at), 'P')}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span>
                {match.scheduled_time
                  ? format(parseISO(match.scheduled_time), 'p')
                  : isUpcoming
                  ? 'Time TBD'
                  : format(parseISO(match.end_time || match.updated_at), 'p')}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span>{courtName}</span>
            </div>
          </div>

          {!isUpcoming && (
            <div className="flex items-center justify-between pt-2 border-t">
              <span className="text-sm font-medium">Score: {renderScore(match.scores)}</span>
              <span className="text-xs text-muted-foreground">
                Completed {format(parseISO(match.end_time || match.updated_at), 'p')}
              </span>
            </div>
          )}

          {isUpcoming && (
            <div className="flex gap-2 pt-2 border-t">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleGetDirections(match)}
                style={{ minHeight: touchTargetSize, minWidth: touchTargetSize }}
                className="flex-1"
              >
                <Navigation className="h-4 w-4 mr-1" />
                Directions
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleSetReminder(match)}
                style={{ minHeight: touchTargetSize, minWidth: touchTargetSize }}
                className="flex-1"
              >
                <Bell className="h-4 w-4 mr-1" />
                Remind
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleShareMatch(match)}
                style={{ minHeight: touchTargetSize, minWidth: touchTargetSize }}
              >
                <Share2 className="h-4 w-4" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  // Enhanced Statistics Component
  const StatsSection = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <StatItem
          icon={<Trophy className="h-4 w-4" />}
          label="Matches Won"
          value={playerStats.matchesWon}
          trend={playerStats.trend}
        />
        <StatItem
          icon={<Percent className="h-4 w-4" />}
          label="Win Rate"
          value={`${playerStats.winRate}%`}
          trend={playerStats.trend}
        />
        <StatItem
          label="Matches Played"
          value={playerStats.matchesPlayed}
        />
        <StatItem
          label="Tournaments Won"
          value={playerStats.tournamentsWon}
        />
        <StatItem
          label="Tournaments Played"
          value={playerStats.tournamentsPlayed}
        />
        <StatItem
          label="Current Rating"
          value={playerStats.rating}
        />
      </div>

      {playerStats.matchesPlayed > 0 && (
        <Card className="p-4">
          <h3 className="font-semibold mb-2">Performance Overview</h3>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Win Rate</span>
              <span>{playerStats.winRate}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-green-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${playerStats.winRate}%` }}
              />
            </div>
          </div>
        </Card>
      )}
    </div>
  );

  // Mobile Tab Navigation
  const TabNavigation = () => (
    <div className="flex border-b bg-background sticky top-0 z-10">
      {[
        { key: 'upcoming', label: 'Upcoming', icon: <CalendarDays className="h-4 w-4" /> },
        { key: 'history', label: 'History', icon: <History className="h-4 w-4" /> },
        { key: 'stats', label: 'Stats', icon: <BarChart2 className="h-4 w-4" /> }
      ].map((tab) => (
        <button
          key={tab.key}
          onClick={() => setActiveTab(tab.key as typeof activeTab)}
          style={{ minHeight: touchTargetSize, minWidth: touchTargetSize }}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 py-3 px-4 text-sm font-medium",
            "border-b-2 transition-colors",
            activeTab === tab.key
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          )}
        >
          {tab.icon}
          {tab.label}
        </button>
      ))}
    </div>
  );

  return (
    <div
      className="min-h-screen bg-background"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Header with status indicators */}
      <div className="bg-background border-b sticky top-0 z-20">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold">My Dashboard</h1>
            <div className="flex items-center gap-2">
              {/* Connection status */}
              <div className="flex items-center gap-1">
                {isOnline ? (
                  <Wifi className="h-4 w-4 text-green-500" />
                ) : (
                  <WifiOff className="h-4 w-4 text-red-500" />
                )}
              </div>
              {/* Manual refresh button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={handlePullToRefresh}
                disabled={isRefreshing || isLoadingMatches}
                style={{ minHeight: touchTargetSize, minWidth: touchTargetSize }}
              >
                <RefreshCw
                  className={cn(
                    "h-4 w-4",
                    (isRefreshing || isLoadingMatches) && "animate-spin"
                  )}
                />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Pull to refresh indicator */}
      {isRefreshing && (
        <div className="text-center py-2 bg-blue-50 text-blue-600 text-sm">
          Refreshing...
        </div>
      )}

      {/* Tab Navigation */}
      <TabNavigation />

      {/* Content */}
      <div className="container mx-auto px-4 py-4">
        {errorMatches && (
          <Card className="mb-4 bg-red-50 border-red-200">
            <CardContent className="p-4">
              <div className="text-red-600">Error: {errorMatches}</div>
              <Button
                variant="outline"
                size="sm"
                onClick={fetchMatchesAndNames}
                className="mt-2"
              >
                Try Again
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Upcoming Matches Tab */}
        {activeTab === 'upcoming' && (
          <div className="space-y-4">
            {isLoadingMatches && (
              <Card>
                <CardContent className="p-8 text-center">
                  <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2 text-muted-foreground" />
                  <p>Loading upcoming matches...</p>
                </CardContent>
              </Card>
            )}

            {!isLoadingMatches && upcomingMatches.length === 0 && (
              <Card>
                <CardContent className="p-8 text-center text-muted-foreground">
                  <CalendarDays className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No upcoming matches scheduled.</p>
                  <p className="text-sm mt-1">Check back later or contact the organizer.</p>
                </CardContent>
              </Card>
            )}

            {!isLoadingMatches && upcomingMatches.length > 0 && (
              <div className="space-y-3">
                {upcomingMatches.map(match => (
                  <MatchCard key={match.id} match={match} isUpcoming={true} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Match History Tab */}
        {activeTab === 'history' && (
          <div className="space-y-4">
            {isLoadingMatches && (
              <Card>
                <CardContent className="p-8 text-center">
                  <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2 text-muted-foreground" />
                  <p>Loading match history...</p>
                </CardContent>
              </Card>
            )}

            {!isLoadingMatches && completedMatches.length === 0 && (
              <Card>
                <CardContent className="p-8 text-center text-muted-foreground">
                  <History className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No completed matches found.</p>
                  <p className="text-sm mt-1">Your match history will appear here after you play.</p>
                </CardContent>
              </Card>
            )}

            {!isLoadingMatches && paginatedHistory.length > 0 && (
              <div className="space-y-3">
                {paginatedHistory.map(match => (
                  <MatchCard key={match.id} match={match} isUpcoming={false} />
                ))}

                {/* Load More Button */}
                {hasMoreHistory && (
                  <Card>
                    <CardContent className="p-4 text-center">
                      <Button
                        variant="outline"
                        onClick={loadMoreHistory}
                        disabled={isLoadingMore}
                        style={{ minHeight: touchTargetSize, minWidth: touchTargetSize }}
                      >
                        {isLoadingMore ? (
                          <>
                            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                            Loading More...
                          </>
                        ) : (
                          <>
                            <ChevronDown className="h-4 w-4 mr-2" />
                            Load More Matches
                          </>
                        )}
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </div>
        )}

        {/* Statistics Tab */}
        {activeTab === 'stats' && (
          <div>
            {isLoadingMatches && (
              <Card>
                <CardContent className="p-8 text-center">
                  <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2 text-muted-foreground" />
                  <p>Loading statistics...</p>
                </CardContent>
              </Card>
            )}

            {!isLoadingMatches && !user && (
              <Card>
                <CardContent className="p-8 text-center text-muted-foreground">
                  <BarChart2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Could not load user data for statistics.</p>
                </CardContent>
              </Card>
            )}

            {!isLoadingMatches && user && <StatsSection />}
          </div>
        )}
      </div>
    </div>
  );
};

// Enhanced StatItem component with trend indicators
interface StatItemProps {
  icon?: React.ReactNode;
  label: string;
  value: string | number;
  trend?: 'up' | 'down' | 'stable';
  className?: string;
}

const StatItem: React.FC<StatItemProps> = ({ icon, label, value, trend, className }) => (
  <div className={cn("flex flex-col p-3 bg-muted/50 rounded-lg", className)}>
    <div className="flex items-center justify-between mb-1">
      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
        {icon}
        <span>{label}</span>
      </div>
      {trend && trend !== 'stable' && (
        <div className={cn(
          "flex items-center",
          trend === 'up' ? "text-green-500" : "text-red-500"
        )}>
          {trend === 'up' ? (
            <TrendingUp className="h-3 w-3" />
          ) : (
            <TrendingDown className="h-3 w-3" />
          )}
        </div>
      )}
    </div>
    <div className="text-2xl font-semibold">{value}</div>
  </div>
);

export default PlayerDashboard; 