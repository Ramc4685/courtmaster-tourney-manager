/**
 * Tournament Analytics Service for CourtMaster Tournament Management System
 * 
 * Provides data aggregation and analytics capabilities for tournament metrics:
 * - Registration statistics
 * - Match completion rates
 * - Court utilization
 * - Schedule adherence
 * - Player participation
 * - Performance metrics
 * 
 * Includes functionality for exporting reports and historical data comparison.
 */

import { Query } from 'appwrite';
import { databases, COLLECTIONS, APPWRITE_DATABASE_ID } from '../../lib/appwrite';
import { MatchStatus } from '../../types/tournament-enums';

// Registration analytics
export interface RegistrationAnalytics {
  total: number;
  by_status: Record<string, number>;
  by_division: Record<string, number>;
  by_date: Record<string, number>;
  conversion_rate: number;
}

// Match analytics
export interface MatchAnalytics {
  total: number;
  completed: number;
  in_progress: number;
  scheduled: number;
  pending: number;
  average_duration_minutes: number;
  by_division: Record<string, number>;
  by_round: Record<string, number>;
  score_distribution: Record<string, number>;
}

// Court utilization
export interface CourtUtilization {
  court_count: number;
  total_court_hours: number;
  used_court_hours: number;
  utilization_percentage: number;
  by_court: Record<string, number>;
  by_hour: Record<string, number>;
  by_day: Record<string, number>;
}

// Schedule analytics
export interface ScheduleAnalytics {
  on_time_percentage: number;
  average_delay_minutes: number;
  matches_started_late: number;
  matches_started_early: number;
  matches_on_schedule: number;
  schedule_efficiency: number;
}

// Player analytics
export interface PlayerAnalytics {
  total_players: number;
  active_players: number;
  average_matches_per_player: number;
  most_active_players: PlayerStat[];
  by_age_group?: Record<string, number>;
  by_gender?: Record<string, number>;
  by_skill_level?: Record<string, number>;
}

// Player statistics
export interface PlayerStat {
  id: string;
  name: string;
  matches_played: number;
  matches_won: number;
  win_rate: number;
}

// Tournament overview analytics
export interface TournamentOverview {
  tournament_id: string;
  name: string;
  status: string;
  start_date: string;
  end_date: string;
  days_elapsed: number;
  days_remaining: number;
  completion_percentage: number;
  total_registrations: number;
  total_matches: number;
  total_players: number;
}

// Comprehensive tournament analytics
export interface TournamentAnalytics {
  overview: TournamentOverview;
  registrations: RegistrationAnalytics;
  matches: MatchAnalytics;
  courts: CourtUtilization;
  schedule: ScheduleAnalytics;
  players: PlayerAnalytics;
  last_updated: string;
}

// Report format options
export enum ReportFormat {
  PDF = 'pdf',
  CSV = 'csv',
  JSON = 'json',
  EXCEL = 'excel',
}

// Analytics time period
export interface TimeRange {
  start: Date;
  end: Date;
}

/**
 * Tournament Analytics Service
 */
class TournamentAnalyticsService {
  /**
   * Get comprehensive analytics for a tournament
   */
  async getTournamentAnalytics(tournamentId: string): Promise<TournamentAnalytics> {
    try {
      // Get tournament overview
      const overview = await this.getTournamentOverview(tournamentId);
      
      // Get registration analytics
      const registrations = await this.getRegistrationAnalytics(tournamentId);
      
      // Get match analytics
      const matches = await this.getMatchAnalytics(tournamentId);
      
      // Get court utilization
      const courts = await this.getCourtUtilization(tournamentId);
      
      // Get schedule analytics
      const schedule = await this.getScheduleAnalytics(tournamentId);
      
      // Get player analytics
      const players = await this.getPlayerAnalytics(tournamentId);
      
      return {
        overview,
        registrations,
        matches,
        courts,
        schedule,
        players,
        last_updated: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error getting tournament analytics:', error);
      throw error;
    }
  }
  
  /**
   * Get tournament overview analytics
   */
  async getTournamentOverview(tournamentId: string): Promise<TournamentOverview> {
    try {
      // Get tournament details
      const tournament = await databases.getDocument(
        APPWRITE_DATABASE_ID,
        COLLECTIONS.TOURNAMENTS,
        tournamentId
      );
      
      // Get registration count
      const registrationsResponse = await databases.listDocuments(
        APPWRITE_DATABASE_ID,
        COLLECTIONS.REGISTRATIONS,
        [Query.equal('tournament_id', tournamentId)]
      );
      
      // Get match count
      const matchesResponse = await databases.listDocuments(
        APPWRITE_DATABASE_ID,
        COLLECTIONS.MATCHES,
        [Query.equal('tournament_id', tournamentId)]
      );
      
      // Calculate days elapsed and remaining
      const startDate = new Date(tournament.start_date);
      const endDate = new Date(tournament.end_date);
      const now = new Date();
      
      const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      const daysElapsed = Math.max(0, Math.ceil((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)));
      const daysRemaining = Math.max(0, Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
      
      // Calculate completion percentage
      const completionPercentage = totalDays > 0 ? Math.min(100, Math.round((daysElapsed / totalDays) * 100)) : 0;
      
      // Get unique players
      const uniquePlayers = new Set();
      
      registrationsResponse.documents.forEach(reg => {
        if (reg.player_id) uniquePlayers.add(reg.player_id);
        if (reg.partner_id) uniquePlayers.add(reg.partner_id);
      });
      
      return {
        tournament_id: tournament.$id,
        name: tournament.name,
        status: tournament.status,
        start_date: tournament.start_date,
        end_date: tournament.end_date,
        days_elapsed: daysElapsed,
        days_remaining: daysRemaining,
        completion_percentage: completionPercentage,
        total_registrations: registrationsResponse.total,
        total_matches: matchesResponse.total,
        total_players: uniquePlayers.size
      };
    } catch (error) {
      console.error('Error getting tournament overview:', error);
      throw error;
    }
  }
  
  /**
   * Get registration analytics
   */
  async getRegistrationAnalytics(tournamentId: string): Promise<RegistrationAnalytics> {
    try {
      // Get all registrations for the tournament
      const registrationsResponse = await databases.listDocuments(
        APPWRITE_DATABASE_ID,
        COLLECTIONS.REGISTRATIONS,
        [Query.equal('tournament_id', tournamentId)]
      );
      
      const registrations = registrationsResponse.documents;
      
      // Calculate statistics by status
      const byStatus: Record<string, number> = {};
      
      registrations.forEach(reg => {
        const status = reg.status;
        byStatus[status] = (byStatus[status] || 0) + 1;
      });
      
      // Calculate statistics by division
      const byDivision: Record<string, number> = {};
      
      registrations.forEach(reg => {
        const divisionId = reg.division_id;
        byDivision[divisionId] = (byDivision[divisionId] || 0) + 1;
      });
      
      // Calculate statistics by date
      const byDate: Record<string, number> = {};
      
      registrations.forEach(reg => {
        const date = reg.$createdAt.split('T')[0];
        byDate[date] = (byDate[date] || 0) + 1;
      });
      
      // Calculate conversion rate (approved / total)
      const approvedCount = byStatus['approved'] || 0;
      const totalCount = registrations.length;
      const conversionRate = totalCount > 0 ? approvedCount / totalCount : 0;
      
      return {
        total: totalCount,
        by_status: byStatus,
        by_division: byDivision,
        by_date: byDate,
        conversion_rate: conversionRate
      };
    } catch (error) {
      console.error('Error getting registration analytics:', error);
      throw error;
    }
  }
  
  /**
   * Get match analytics
   */
  async getMatchAnalytics(tournamentId: string): Promise<MatchAnalytics> {
    try {
      // Get all matches for the tournament
      const matchesResponse = await databases.listDocuments(
        APPWRITE_DATABASE_ID,
        COLLECTIONS.MATCHES,
        [Query.equal('tournament_id', tournamentId)]
      );
      
      const matches = matchesResponse.documents;
      
      // Count matches by status
      let completed = 0;
      let inProgress = 0;
      let scheduled = 0;
      let pending = 0;
      
      matches.forEach(match => {
        const status = match.status?.toLowerCase();
        switch (status) {
          case MatchStatus.COMPLETED.toLowerCase():
            completed++;
            break;
          case MatchStatus.IN_PROGRESS.toLowerCase():
            inProgress++;
            break;
          case MatchStatus.SCHEDULED.toLowerCase():
            scheduled++;
            break;
          default:
            pending++;
            break;
        }
      });
      
      // Calculate average duration
      let totalDuration = 0;
      let matchesWithDuration = 0;
      
      matches.forEach(match => {
        if (match.start_time && match.end_time) {
          const startTime = new Date(match.start_time).getTime();
          const endTime = new Date(match.end_time).getTime();
          const duration = (endTime - startTime) / (1000 * 60); // Duration in minutes
          
          if (duration > 0) {
            totalDuration += duration;
            matchesWithDuration++;
          }
        }
      });
      
      const averageDuration = matchesWithDuration > 0 ? totalDuration / matchesWithDuration : 0;
      
      // Calculate matches by division
      const byDivision: Record<string, number> = {};
      
      matches.forEach(match => {
        const divisionId = match.division_id;
        if (divisionId) {
          byDivision[divisionId] = (byDivision[divisionId] || 0) + 1;
        }
      });
      
      // Calculate matches by round
      const byRound: Record<string, number> = {};
      
      matches.forEach(match => {
        const round = match.round_number?.toString() || 'unknown';
        byRound[round] = (byRound[round] || 0) + 1;
      });
      
      // Calculate score distribution (simplified version)
      const scoreDistribution: Record<string, number> = {};
      
      matches.forEach(match => {
        if (match.scores) {
          try {
            const scores = JSON.parse(match.scores);
            const scoreKey = this.getScoreKey(scores);
            
            if (scoreKey) {
              scoreDistribution[scoreKey] = (scoreDistribution[scoreKey] || 0) + 1;
            }
          } catch (error) {
            console.warn('Error parsing match scores:', error);
          }
        }
      });
      
      return {
        total: matches.length,
        completed,
        in_progress: inProgress,
        scheduled,
        pending,
        average_duration_minutes: averageDuration,
        by_division: byDivision,
        by_round: byRound,
        score_distribution: scoreDistribution
      };
    } catch (error) {
      console.error('Error getting match analytics:', error);
      throw error;
    }
  }
  
  /**
   * Get court utilization analytics
   */
  async getCourtUtilization(tournamentId: string): Promise<CourtUtilization> {
    try {
      // Get all courts for the tournament
      const courtsResponse = await databases.listDocuments(
        APPWRITE_DATABASE_ID,
        COLLECTIONS.COURTS,
        [Query.equal('tournament_id', tournamentId)]
      );
      
      // Get all matches with court assignments
      const matchesResponse = await databases.listDocuments(
        APPWRITE_DATABASE_ID,
        COLLECTIONS.MATCHES,
        [
          Query.equal('tournament_id', tournamentId),
          Query.notEqual('court_id', null)
        ]
      );
      
      const courts = courtsResponse.documents;
      const matches = matchesResponse.documents;
      
      // Calculate court hours based on tournament duration
      const tournament = await databases.getDocument(
        APPWRITE_DATABASE_ID,
        COLLECTIONS.TOURNAMENTS,
        tournamentId
      );
      
      const startDate = new Date(tournament.start_date);
      const endDate = new Date(tournament.end_date);
      const tournamentDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      
      // Assume 8 hours of play per day per court
      const hoursPerDay = 8;
      const totalCourtHours = courts.length * tournamentDays * hoursPerDay;
      
      // Calculate used court time
      let usedCourtMinutes = 0;
      const byCourtMinutes: Record<string, number> = {};
      const byHour: Record<string, number> = {};
      const byDay: Record<string, number> = {};
      
      matches.forEach(match => {
        let duration = 0;
        
        if (match.start_time && match.end_time) {
          // Calculate actual duration if available
          const startTime = new Date(match.start_time);
          const endTime = new Date(match.end_time);
          duration = (endTime.getTime() - startTime.getTime()) / (1000 * 60);
          
          // Track by hour of day
          const hour = startTime.getHours();
          byHour[hour] = (byHour[hour] || 0) + 1;
          
          // Track by day
          const day = startTime.toISOString().split('T')[0];
          byDay[day] = (byDay[day] || 0) + 1;
        } else {
          // Use default duration of 45 minutes if actual times not available
          duration = 45;
        }
        
        if (duration > 0) {
          usedCourtMinutes += duration;
          
          // Track by court
          const courtId = match.court_id;
          byCourtMinutes[courtId] = (byCourtMinutes[courtId] || 0) + duration;
        }
      });
      
      const usedCourtHours = usedCourtMinutes / 60;
      const utilizationPercentage = totalCourtHours > 0 ? (usedCourtHours / totalCourtHours) * 100 : 0;
      
      // Convert byCourtMinutes to hours
      const byCourt: Record<string, number> = {};
      for (const courtId in byCourtMinutes) {
        byCourt[courtId] = byCourtMinutes[courtId] / 60;
      }
      
      return {
        court_count: courts.length,
        total_court_hours: totalCourtHours,
        used_court_hours: usedCourtHours,
        utilization_percentage: utilizationPercentage,
        by_court: byCourt,
        by_hour: byHour,
        by_day: byDay
      };
    } catch (error) {
      console.error('Error getting court utilization:', error);
      throw error;
    }
  }
  
  /**
   * Get schedule adherence analytics
   */
  async getScheduleAnalytics(tournamentId: string): Promise<ScheduleAnalytics> {
    try {
      // Get all matches with scheduled and start times
      const matchesResponse = await databases.listDocuments(
        APPWRITE_DATABASE_ID,
        COLLECTIONS.MATCHES,
        [
          Query.equal('tournament_id', tournamentId),
          Query.notEqual('scheduled_time', null),
          Query.notEqual('start_time', null)
        ]
      );
      
      const matches = matchesResponse.documents;
      
      // Calculate schedule metrics
      let totalDelayMinutes = 0;
      let matchesStartedLate = 0;
      let matchesStartedEarly = 0;
      let matchesOnSchedule = 0;
      
      matches.forEach(match => {
        const scheduledTime = new Date(match.scheduled_time).getTime();
        const startTime = new Date(match.start_time).getTime();
        const differenceMinutes = (startTime - scheduledTime) / (1000 * 60);
        
        // Add to total delay (can be negative for early starts)
        totalDelayMinutes += differenceMinutes;
        
        // Count matches by timing
        if (differenceMinutes > 5) { // More than 5 minutes late
          matchesStartedLate++;
        } else if (differenceMinutes < -5) { // More than 5 minutes early
          matchesStartedEarly++;
        } else { // Within 5 minutes of scheduled time
          matchesOnSchedule++;
        }
      });
      
      const matchCount = matches.length;
      const averageDelayMinutes = matchCount > 0 ? totalDelayMinutes / matchCount : 0;
      const onTimePercentage = matchCount > 0 ? (matchesOnSchedule / matchCount) * 100 : 0;
      
      // Calculate schedule efficiency (higher is better)
      // A perfect schedule has all matches starting on time
      const scheduleEfficiency = matchCount > 0 ? (1 - Math.abs(averageDelayMinutes) / 60) * 100 : 0;
      
      return {
        on_time_percentage: onTimePercentage,
        average_delay_minutes: averageDelayMinutes,
        matches_started_late: matchesStartedLate,
        matches_started_early: matchesStartedEarly,
        matches_on_schedule: matchesOnSchedule,
        schedule_efficiency: Math.max(0, Math.min(100, scheduleEfficiency))
      };
    } catch (error) {
      console.error('Error getting schedule analytics:', error);
      throw error;
    }
  }
  
  /**
   * Get player analytics
   */
  async getPlayerAnalytics(tournamentId: string): Promise<PlayerAnalytics> {
    try {
      // Get all registrations for the tournament
      const registrationsResponse = await databases.listDocuments(
        APPWRITE_DATABASE_ID,
        COLLECTIONS.REGISTRATIONS,
        [
          Query.equal('tournament_id', tournamentId),
          Query.equal('status', 'approved')
        ]
      );
      
      // Get all matches for the tournament
      const matchesResponse = await databases.listDocuments(
        APPWRITE_DATABASE_ID,
        COLLECTIONS.MATCHES,
        [Query.equal('tournament_id', tournamentId)]
      );
      
      const registrations = registrationsResponse.documents;
      const matches = matchesResponse.documents;
      
      // Get unique players
      const uniquePlayers = new Set<string>();
      const playerMatches: Record<string, number> = {};
      const playerWins: Record<string, number> = {};
      const playerNames: Record<string, string> = {};
      
      // Count players from registrations
      registrations.forEach(reg => {
        if (reg.player_id) {
          uniquePlayers.add(reg.player_id);
          playerNames[reg.player_id] = reg.player_name || 'Unknown';
        }
        if (reg.partner_id) {
          uniquePlayers.add(reg.partner_id);
          playerNames[reg.partner_id] = reg.partner_name || 'Unknown';
        }
      });
      
      // Count matches and wins
      matches.forEach(match => {
        // Track player1 matches and wins
        if (match.player1_id) {
          playerMatches[match.player1_id] = (playerMatches[match.player1_id] || 0) + 1;
          
          if (match.status === 'completed' && match.winner_id === match.player1_id) {
            playerWins[match.player1_id] = (playerWins[match.player1_id] || 0) + 1;
          }
        }
        
        // Track player2 matches and wins
        if (match.player2_id) {
          playerMatches[match.player2_id] = (playerMatches[match.player2_id] || 0) + 1;
          
          if (match.status === 'completed' && match.winner_id === match.player2_id) {
            playerWins[match.player2_id] = (playerWins[match.player2_id] || 0) + 1;
          }
        }
        
        // Also track team members if it's a team match
        if (match.team1_id) {
          // We would need to fetch team members here in a full implementation
        }
        
        if (match.team2_id) {
          // We would need to fetch team members here in a full implementation
        }
      });
      
      // Calculate active players (those who have played at least one match)
      const activePlayers = Object.keys(playerMatches).length;
      
      // Calculate average matches per player
      const totalMatches = Object.values(playerMatches).reduce((sum, count) => sum + count, 0);
      const avgMatchesPerPlayer = uniquePlayers.size > 0 ? totalMatches / uniquePlayers.size : 0;
      
      // Get most active players
      const playerStats: PlayerStat[] = Array.from(uniquePlayers).map(id => {
        const matchesPlayed = playerMatches[id] || 0;
        const matchesWon = playerWins[id] || 0;
        const winRate = matchesPlayed > 0 ? matchesWon / matchesPlayed : 0;
        
        return {
          id,
          name: playerNames[id] || 'Unknown',
          matches_played: matchesPlayed,
          matches_won: matchesWon,
          win_rate: winRate
        };
      });
      
      // Sort by matches played descending
      const mostActivePlayers = playerStats
        .sort((a, b) => b.matches_played - a.matches_played)
        .slice(0, 10); // Get top 10
      
      return {
        total_players: uniquePlayers.size,
        active_players: activePlayers,
        average_matches_per_player: avgMatchesPerPlayer,
        most_active_players: mostActivePlayers,
      };
    } catch (error) {
      console.error('Error getting player analytics:', error);
      throw error;
    }
  }
  
  /**
   * Export tournament analytics report
   */
  async exportAnalyticsReport(
    tournamentId: string,
    format: ReportFormat = ReportFormat.PDF,
    options: { sections?: string[] } = {}
  ): Promise<string> {
    try {
      // Get analytics data
      const analytics = await this.getTournamentAnalytics(tournamentId);
      
      // Filter sections if specified
      if (options.sections && options.sections.length > 0) {
        const filteredAnalytics: any = { overview: analytics.overview };
        
        options.sections.forEach(section => {
          if (section in analytics) {
            filteredAnalytics[section] = (analytics as any)[section];
          }
        });
        
        // In a real implementation, this would generate the report in the requested format
        console.log(`Generating ${format} report with filtered sections:`, options.sections);
        
        return JSON.stringify(filteredAnalytics);
      }
      
      // In a real implementation, this would generate the report in the requested format
      console.log(`Generating ${format} report for tournament ${tournamentId}`);
      
      // For now, return JSON string
      return JSON.stringify(analytics);
    } catch (error) {
      console.error('Error exporting analytics report:', error);
      throw error;
    }
  }
  
  /**
   * Compare tournament analytics between two periods
   */
  async compareTournamentAnalytics(
    tournamentId: string,
    period1: TimeRange,
    period2: TimeRange
  ): Promise<any> {
    // This is a placeholder for a more complex implementation
    // In a real implementation, this would compare metrics between two time periods
    
    console.log(`Comparing analytics for tournament ${tournamentId} between periods:`, {
      period1: { start: period1.start.toISOString(), end: period1.end.toISOString() },
      period2: { start: period2.start.toISOString(), end: period2.end.toISOString() }
    });
    
    return {
      period1: {
        start: period1.start.toISOString(),
        end: period1.end.toISOString(),
      },
      period2: {
        start: period2.start.toISOString(),
        end: period2.end.toISOString(),
      },
      comparison: {
        matches: {
          period1_count: 0,
          period2_count: 0,
          change_percentage: 0
        },
        registrations: {
          period1_count: 0,
          period2_count: 0,
          change_percentage: 0
        },
        court_utilization: {
          period1_percentage: 0,
          period2_percentage: 0,
          change_percentage: 0
        }
      }
    };
  }
  
  /**
   * Helper function to generate a consistent score key for analytics
   */
  private getScoreKey(scores: any): string | null {
    if (!scores || typeof scores !== 'object') {
      return null;
    }
    
    try {
      // Extract sets and create a summary score (e.g., "21-19,19-21,21-15")
      if (Array.isArray(scores.sets)) {
        return scores.sets
          .map((set: any) => `${set.team1Score}-${set.team2Score}`)
          .join(',');
      }
      
      // Fallback for different score formats
      return JSON.stringify(scores);
    } catch (error) {
      console.warn('Error generating score key:', error);
      return null;
    }
  }
}

export default new TournamentAnalyticsService();
