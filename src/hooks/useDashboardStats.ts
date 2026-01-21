import { useState, useEffect, useCallback, useRef } from 'react';
import { dashboardService, TournamentStats, DashboardActivity, ActiveMatch, UpcomingMatch, AvailableCourt } from '../services/dashboard/DashboardService';
import { realtimeTournamentService } from '../services/realtime/RealtimeTournamentService';
import { eventBus, EventType } from '../events/eventBus';

export interface DashboardData {
  stats: TournamentStats | null;
  activeMatches: ActiveMatch[];
  upcomingMatches: UpcomingMatch[];
  availableCourts: AvailableCourt[];
  recentActivity: DashboardActivity[];
}

export interface UseDashboardStatsReturn {
  data: DashboardData;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  lastUpdated: Date | null;
}

const POLLING_INTERVAL = 30000; // 30 seconds
const DEBOUNCE_DELAY = 1000; // 1 second

export function useDashboardStats(tournamentId: string | undefined): UseDashboardStatsReturn {
  const [data, setData] = useState<DashboardData>({
    stats: null,
    activeMatches: [],
    upcomingMatches: [],
    availableCourts: [],
    recentActivity: []
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const mountedRef = useRef(true);

  const fetchDashboardData = useCallback(async (showLoading = true) => {
    if (!tournamentId) return;

    if (showLoading) setLoading(true);
    setError(null);

    try {
      // Fetch all dashboard data in parallel
      const [stats, activeMatches, upcomingMatches, availableCourts, recentActivity] = await Promise.all([
        dashboardService.getTournamentStats(tournamentId),
        dashboardService.getActiveMatches(tournamentId),
        dashboardService.getUpcomingMatches(tournamentId),
        dashboardService.getAvailableCourts(tournamentId),
        dashboardService.getRecentActivity(tournamentId)
      ]);

      if (mountedRef.current) {
        setData({
          stats,
          activeMatches,
          upcomingMatches,
          availableCourts,
          recentActivity
        });
        setLastUpdated(new Date());
      }
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      if (mountedRef.current) {
        setError(err instanceof Error ? err.message : 'Failed to fetch dashboard data');
      }
    } finally {
      if (mountedRef.current && showLoading) {
        setLoading(false);
      }
    }
  }, [tournamentId]);

  const debouncedRefresh = useCallback(() => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    debounceTimeoutRef.current = setTimeout(() => {
      fetchDashboardData(false); // Don't show loading for debounced updates
    }, DEBOUNCE_DELAY);
  }, [fetchDashboardData]);

  const refresh = useCallback(async () => {
    await fetchDashboardData(true);
  }, [fetchDashboardData]);

  // Setup polling
  useEffect(() => {
    if (!tournamentId) return;

    // Initial fetch
    fetchDashboardData(true);

    // Setup polling interval
    pollingIntervalRef.current = setInterval(() => {
      fetchDashboardData(false); // Background updates don't show loading
    }, POLLING_INTERVAL);

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, [tournamentId, fetchDashboardData]);

  // Setup real-time subscriptions
  useEffect(() => {
    if (!tournamentId) return;

    // Subscribe to tournament updates
    const unsubscribeTournament = realtimeTournamentService.subscribeTournament(
      tournamentId,
      (_update) => {
        debouncedRefresh();
      }
    );

    // Subscribe to match updates
    const unsubscribeMatches = realtimeTournamentService.subscribeInProgressMatches(
      tournamentId,
      debouncedRefresh
    );

    return () => {
      unsubscribeTournament?.();
      unsubscribeMatches?.();
    };
  }, [tournamentId, debouncedRefresh]);

  // Setup event bus listeners
  useEffect(() => {
    const eventHandlers = [
      { event: EventType.CHECK_IN_COMPLETED, handler: debouncedRefresh },
      { event: EventType.MATCH_STARTED, handler: debouncedRefresh },
      { event: EventType.MATCH_COMPLETED, handler: debouncedRefresh },
      { event: EventType.SCORE_UPDATED, handler: debouncedRefresh },
      { event: EventType.ANNOUNCEMENT_CREATED, handler: debouncedRefresh },
      { event: EventType.COURT_ASSIGNED, handler: debouncedRefresh },
      { event: EventType.COURT_RELEASED, handler: debouncedRefresh }
    ];

    // Subscribe to events
    eventHandlers.forEach(({ event, handler }) => {
      eventBus.on(event, handler);
    });

    return () => {
      // Unsubscribe from events
      eventHandlers.forEach(({ event, handler }) => {
        eventBus.off(event, handler);
      });
    };
  }, [debouncedRefresh]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false;

      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }

      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }

      // Clear cache for this tournament when component unmounts
      if (tournamentId) {
        dashboardService.clearTournamentCache(tournamentId);
      }
    };
  }, [tournamentId]);

  return {
    data,
    loading,
    error,
    refresh,
    lastUpdated
  };
}
