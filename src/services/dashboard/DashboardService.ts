import { tournamentService } from '../tournament/TournamentService';
import { matchService } from '../tournament/MatchService';
import { registrationService } from '../registrationService';
import { notificationService } from '../notificationService';
import { Match, Court, RegistrationStatus, MatchStatus } from '../../types/entities';
import eventBus, { EventType } from '@/events/eventBus';

export interface TournamentStats {
  totalPlayerRegistrations: number;
  checkedInPlayers: number;
  totalTeamRegistrations: number;
  checkedInTeams: number;
  totalRegistrations: number;
  totalMatches: number;
  activeMatches: number;
  completedMatches: number;
  scheduledMatches: number;
  totalCourts: number;
  availableCourts: number;
  pendingAnnouncements: number;
}

export interface DashboardActivity {
  id: string;
  type: 'check-in' | 'match-start' | 'match-complete' | 'court-assignment' | 'court-release' | 'announcement';
  description: string;
  timestamp: Date;
  details?: any;
}

export interface ActiveMatch {
  id: string;
  courtId: string;
  courtName: string;
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  startTime: Date;
  status: string;
}

export interface UpcomingMatch {
  id: string;
  homeTeam: string;
  awayTeam: string;
  scheduledTime: Date;
  category: string;
  estimatedDuration: number;
}

export interface AvailableCourt {
  id: string;
  name: string;
  status: 'AVAILABLE' | 'IN_USE' | 'MAINTENANCE';
  currentMatch?: string;
  lastActivity?: Date;
}

class DashboardService {
  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>();
  private readonly CACHE_TTL = 30000; // 30 seconds
  private readonly ACTIVITY_TTL = 60 * 60 * 1000; // 60 minutes
  private readonly MAX_ACTIVITY_BUFFER = 100;
  private activityBuffer: DashboardActivity[] = [];

  constructor() {
    this.registerEventListeners();
  }

  private getFromCache<T>(key: string): T | null {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < cached.ttl) {
      return cached.data;
    }
    this.cache.delete(key);
    return null;
  }

  private setCache(key: string, data: any, ttl: number = this.CACHE_TTL): void {
    this.cache.set(key, { data, timestamp: Date.now(), ttl });
  }

  private registerEventListeners(): void {
    eventBus.subscribe(EventType.CHECK_IN_COMPLETED, ({ data, timestamp }) => {
      this.recordActivity({
        id: `check-in-${data.registrationId}-${timestamp}`,
        type: 'check-in',
        description: `${data.name || 'Participant'} checked in`,
        timestamp: new Date(timestamp),
        details: data
      });
    });

    eventBus.subscribe(EventType.COURT_ASSIGNED, ({ data, timestamp }) => {
      this.recordActivity({
        id: `court-assigned-${data.matchId}-${timestamp}`,
        type: 'court-assignment',
        description: `Court assigned to match ${data.matchId || ''}`.trim(),
        timestamp: new Date(timestamp),
        details: data
      });
    });

    eventBus.subscribe(EventType.COURT_RELEASED, ({ data, timestamp }) => {
      this.recordActivity({
        id: `court-released-${data.matchId}-${timestamp}`,
        type: 'court-release',
        description: `Court released${data.courtId ? ` from court ${data.courtId}` : ''}`,
        timestamp: new Date(timestamp),
        details: data
      });
    });
  }

  private recordActivity(activity: DashboardActivity): void {
    const cutoff = Date.now() - this.ACTIVITY_TTL;
    this.activityBuffer = [
      activity,
      ...this.activityBuffer.filter(item => item.timestamp.getTime() >= cutoff)
    ].slice(0, this.MAX_ACTIVITY_BUFFER);
  }

  async getTournamentStats(tournamentId: string): Promise<TournamentStats> {
    const cacheKey = `stats-${tournamentId}`;
    const cached = this.getFromCache<TournamentStats>(cacheKey);
    if (cached) return cached;

    try {
      const [
        tournament,
        playerRegistrations,
        teamRegistrations,
        announcements
      ] = await Promise.all([
        tournamentService.getTournament(tournamentId),
        registrationService.getPlayerRegistrations(tournamentId),
        registrationService.getTeamRegistrations(tournamentId),
        notificationService.getTournamentAnnouncements(tournamentId).catch(() => [])
      ]);

      const matches = tournament?.matches || [];
      const courts = tournament?.courts || [];

      const totalPlayerRegistrations = playerRegistrations.length;
      const totalTeamRegistrations = teamRegistrations.length;
      const checkedInPlayers = playerRegistrations.filter(reg => reg.status === RegistrationStatus.CHECKED_IN).length;
      const checkedInTeams = teamRegistrations.filter(reg => reg.status === RegistrationStatus.CHECKED_IN).length;
      const totalRegistrations = totalPlayerRegistrations + totalTeamRegistrations;

      const totalMatches = matches.length;
      const activeMatches = matches.filter(match => match.status === MatchStatus.IN_PROGRESS).length;
      const completedMatches = matches.filter(match => match.status === MatchStatus.COMPLETED).length;
      const scheduledMatches = matches.filter(match => match.status === MatchStatus.SCHEDULED).length;

      const totalCourts = courts.length;
      const availableCourts = Math.max(0, courts.filter(court => court.status === 'AVAILABLE').length);

      const pendingAnnouncements = announcements.filter(announcement => announcement.status === 'ACTIVE').length;

      const stats: TournamentStats = {
        totalPlayerRegistrations,
        checkedInPlayers,
        totalTeamRegistrations,
        checkedInTeams,
        totalRegistrations,
        totalMatches,
        activeMatches,
        completedMatches,
        scheduledMatches,
        totalCourts,
        availableCourts,
        pendingAnnouncements
      };

      this.setCache(cacheKey, stats);
      return stats;
    } catch (error) {
      console.error('Error fetching tournament stats:', error);
      throw error;
    }
  }

  async getActiveMatches(tournamentId: string): Promise<ActiveMatch[]> {
    const cacheKey = `active-matches-${tournamentId}`;
    const cached = this.getFromCache<ActiveMatch[]>(cacheKey);
    if (cached) return cached;

    try {
      const matches = await matchService.getMatchesByStatus(tournamentId, MatchStatus.IN_PROGRESS);
      const tournament = await tournamentService.getTournament(tournamentId);

      const activeMatches: ActiveMatch[] = matches.map(match => {
        const court = tournament?.courts?.find(c => c.id === match.courtId);
        return {
          id: match.id,
          courtId: match.courtId || '',
          courtName: court?.name || 'TBD',
          homeTeam: match.team1?.name || 'TBD',
          awayTeam: match.team2?.name || 'TBD',
          homeScore: match.scores?.[0]?.team1Score || 0,
          awayScore: match.scores?.[0]?.team2Score || 0,
          startTime: match.startTime ? new Date(match.startTime) : new Date(),
          status: match.status
        };
      });

      this.setCache(cacheKey, activeMatches, 15000); // 15 second cache for active matches
      return activeMatches;
    } catch (error) {
      console.error('Error fetching active matches:', error);
      throw error;
    }
  }

  async getUpcomingMatches(tournamentId: string, limit: number = 5): Promise<UpcomingMatch[]> {
    const cacheKey = `upcoming-matches-${tournamentId}-${limit}`;
    const cached = this.getFromCache<UpcomingMatch[]>(cacheKey);
    if (cached) return cached;

    try {
      const matches = await matchService.getMatchesByStatus(tournamentId, MatchStatus.SCHEDULED);

      const upcomingMatches: UpcomingMatch[] = matches
        .sort((a, b) => {
          const aTime = a.scheduledTime ? new Date(a.scheduledTime).getTime() : 0;
          const bTime = b.scheduledTime ? new Date(b.scheduledTime).getTime() : 0;
          return aTime - bTime;
        })
        .slice(0, limit)
        .map(match => ({
          id: match.id,
          homeTeam: match.team1?.name || 'TBD',
          awayTeam: match.team2?.name || 'TBD',
          scheduledTime: match.scheduledTime ? new Date(match.scheduledTime) : new Date(),
          category: typeof match.division === 'string' ? match.division : 'General',
          estimatedDuration: 45
        }));

      this.setCache(cacheKey, upcomingMatches);
      return upcomingMatches;
    } catch (error) {
      console.error('Error fetching upcoming matches:', error);
      throw error;
    }
  }

  async getAvailableCourts(tournamentId: string): Promise<AvailableCourt[]> {
    const cacheKey = `available-courts-${tournamentId}`;
    const cached = this.getFromCache<AvailableCourt[]>(cacheKey);
    if (cached) return cached;

    try {
      const [tournament, activeMatches] = await Promise.all([
        tournamentService.getTournament(tournamentId),
        this.getActiveMatches(tournamentId)
      ]);

      const courts = tournament?.courts || [];
      const availableCourts: AvailableCourt[] = courts.map(court => {
        const activeMatch = activeMatches.find(match => match.courtId === court.id);
        return {
          id: court.id,
          name: court.name,
          status: activeMatch ? 'IN_USE' : (court.status as any) || 'AVAILABLE',
          currentMatch: activeMatch?.id,
          lastActivity: activeMatch?.startTime
        };
      });

      this.setCache(cacheKey, availableCourts, 20000); // 20 second cache
      return availableCourts;
    } catch (error) {
      console.error('Error fetching available courts:', error);
      throw error;
    }
  }

  async getRecentActivity(tournamentId: string, limit: number = 10): Promise<DashboardActivity[]> {
    try {
      const tournament = await tournamentService.getTournament(tournamentId);
      const recentMatches = tournament?.matches || [];
      const recentAnnouncements = await notificationService.getTournamentAnnouncements(tournamentId).catch(() => []);

      const cutoff = Date.now() - this.ACTIVITY_TTL;

      const bufferedActivities = this.activityBuffer.filter(activity => {
        const activityTournamentId = activity.details?.tournamentId;
        return (
          (!activityTournamentId || activityTournamentId === tournamentId) &&
          activity.timestamp.getTime() >= cutoff
        );
      });

      const activities: DashboardActivity[] = [...bufferedActivities];

      recentMatches
        .filter(match => {
          const updatedAt = match.updatedAt ? new Date(match.updatedAt).getTime() : null;
          return updatedAt !== null && updatedAt >= cutoff;
        })
        .forEach(match => {
          if (match.status === MatchStatus.IN_PROGRESS) {
            activities.push({
              id: `match-start-${match.id}`,
              type: 'match-start',
              description: `Match started: ${match.team1?.name || 'Team 1'} vs ${match.team2?.name || 'Team 2'}`,
              timestamp: match.startTime ? new Date(match.startTime) : new Date(),
              details: { matchId: match.id, court: match.courtId, tournamentId }
            });
          } else if (match.status === MatchStatus.COMPLETED) {
            const homeScore = match.scores?.[0]?.team1Score || 0;
            const awayScore = match.scores?.[0]?.team2Score || 0;
            activities.push({
              id: `match-complete-${match.id}`,
              type: 'match-complete',
              description: `Match completed: ${match.team1?.name || 'Team 1'} ${homeScore} - ${awayScore} ${match.team2?.name || 'Team 2'}`,
              timestamp: match.endTime ? new Date(match.endTime) : new Date(),
              details: { matchId: match.id, court: match.courtId, tournamentId }
            });
          }
        });

      recentAnnouncements
        .filter(announcement => announcement.createdAt && announcement.createdAt.getTime() >= cutoff)
        .forEach(announcement => {
          activities.push({
            id: `announcement-${announcement.id}`,
            type: 'announcement',
            description: `Announcement: ${announcement.title}`,
            timestamp: announcement.createdAt,
            details: { announcementId: announcement.id, tournamentId }
          });
        });

      return activities
        .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
        .slice(0, limit);
    } catch (error) {
      console.error('Error fetching recent activity:', error);
      return [];
    }
  }

  // Cache management
  clearCache(): void {
    this.cache.clear();
  }

  clearTournamentCache(tournamentId: string): void {
    const keys = Array.from(this.cache.keys()).filter(key => key.includes(tournamentId));
    keys.forEach(key => this.cache.delete(key));
  }
}

export const dashboardService = new DashboardService();
