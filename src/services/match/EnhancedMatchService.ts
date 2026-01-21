/**
 * Enhanced Match Service for CourtMaster Tournament Management System
 * 
 * A comprehensive service for managing matches across different sports with support for:
 * - Sport-specific scoring rules
 * - Offline match management
 * - Real-time updates via event bus
 * - Multi-sport tournament management
 */

import { ID } from 'appwrite';
import { databases, COLLECTIONS } from '../../lib/appwrite';
import { Match } from '../../hooks/useScoringLogic';
import { MatchScore, SetScore } from '../../domain/rules/ISportRules';
import SportRulesFactory from '../rules/SportRulesFactory';
import eventBus, { EventType } from '../../events/eventBus';
import { useMatchScoreOfflineSync } from '../../hooks/useOfflineSync';

export interface MatchFilter {
  tournament_id?: string;
  division_id?: string;
  court_id?: string;
  status?: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  round?: number;
  team_id?: string;
  player_id?: string;
  date?: string; // ISO format date string for filtering by scheduled date
}

export interface CourtAssignment {
  court_id: string;
  court_number: number;
  court_name: string;
  match_id: string;
  start_time: string;
  end_time?: string;
  status: 'available' | 'occupied' | 'reserved' | 'maintenance';
}

export class EnhancedMatchService {
  /**
   * Create a new match
   */
  async createMatch(matchData: Partial<Match>): Promise<Match> {
    try {
      // Create a complete match object with required fields
      const newMatch: Match = {
        id: ID.unique(),
        tournament_id: matchData.tournament_id!,
        division_id: matchData.division_id!,
        team1_id: matchData.team1_id!,
        team2_id: matchData.team2_id!,
        team1_name: matchData.team1_name || 'Team 1',
        team2_name: matchData.team2_name || 'Team 2',
        status: matchData.status || 'scheduled',
        sport_type: matchData.sport_type || 'badminton', // Default to badminton if not specified
        round: matchData.round,
        match_number: matchData.match_number,
        format_id: matchData.format_id,
        scores: matchData.scores || this.createEmptyScore(matchData.sport_type || 'badminton', matchData.format_id),
        scheduled_time: matchData.scheduled_time,
        court_id: matchData.court_id,
        ...matchData,
      };

      // Save to database
      const response = await databases.createDocument(
        process.env.VITE_APPWRITE_DATABASE_ID!,
        COLLECTIONS.MATCHES,
        ID.unique(),
        newMatch
      );

      // Emit match created event
      eventBus.emit(EventType.MATCH_CREATED, {
        matchId: response.$id,
        tournamentId: newMatch.tournament_id
      }, 'MatchService');

      return response as unknown as Match;
    } catch (error) {
      console.error('Error creating match:', error);
      throw error;
    }
  }

  /**
   * Create matches in bulk
   */
  async createMatches(matches: Partial<Match>[]): Promise<Match[]> {
    try {
      const createdMatches: Match[] = [];

      // Create each match sequentially
      for (const matchData of matches) {
        const newMatch = await this.createMatch(matchData);
        createdMatches.push(newMatch);
      }

      return createdMatches;
    } catch (error) {
      console.error('Error creating matches in bulk:', error);
      throw error;
    }
  }

  /**
   * Get a match by ID
   */
  async getMatch(matchId: string): Promise<Match> {
    try {
      const response = await databases.getDocument(
        process.env.VITE_APPWRITE_DATABASE_ID!,
        COLLECTIONS.MATCHES,
        matchId
      );

      return response as unknown as Match;
    } catch (error) {
      console.error(`Error fetching match ${matchId}:`, error);
      throw error;
    }
  }

  /**
   * Get all matches based on filters
   */
  async getMatches(filter: MatchFilter = {}): Promise<Match[]> {
    try {
      // Build query filters
      const queries = [];

      if (filter.tournament_id) {
        queries.push(databases.Query.equal('tournament_id', filter.tournament_id));
      }

      if (filter.division_id) {
        queries.push(databases.Query.equal('division_id', filter.division_id));
      }

      if (filter.court_id) {
        queries.push(databases.Query.equal('court_id', filter.court_id));
      }

      if (filter.status) {
        queries.push(databases.Query.equal('status', filter.status));
      }

      if (filter.round !== undefined) {
        queries.push(databases.Query.equal('round', filter.round));
      }

      if (filter.team_id) {
        // Match when the team is either team1 or team2
        queries.push(databases.Query.equal('team1_id', filter.team_id));
        queries.push(databases.Query.equal('team2_id', filter.team_id));
      }

      if (filter.player_id) {
        // For individual sports where player IDs are stored
        queries.push(databases.Query.search('players', filter.player_id));
      }

      if (filter.date) {
        // Filter by date based on scheduled time
        const startOfDay = new Date(filter.date);
        startOfDay.setHours(0, 0, 0, 0);

        const endOfDay = new Date(filter.date);
        endOfDay.setHours(23, 59, 59, 999);

        queries.push(databases.Query.greaterThanEqual('scheduled_time', startOfDay.toISOString()));
        queries.push(databases.Query.lessThanEqual('scheduled_time', endOfDay.toISOString()));
      }

      // Execute query with filters
      const response = await databases.listDocuments(
        process.env.VITE_APPWRITE_DATABASE_ID!,
        COLLECTIONS.MATCHES,
        queries
      );

      return response.documents as unknown as Match[];
    } catch (error) {
      console.error('Error fetching matches:', error);
      throw error;
    }
  }

  /**
   * Update a match
   */
  async updateMatch(matchId: string, updates: Partial<Match>): Promise<Match> {
    try {
      // Exclude id from updates
      const { id, ...updateData } = updates;

      // Add timestamp for real-time updates
      const withTimestamp = {
        ...updateData,
        updated_at: new Date().toISOString()
      };

      const response = await databases.updateDocument(
        process.env.VITE_APPWRITE_DATABASE_ID!,
        COLLECTIONS.MATCHES,
        matchId,
        withTimestamp
      );

      // Emit match updated event
      eventBus.emit(EventType.MATCH_UPDATED, {
        matchId,
        tournamentId: response.tournament_id,
        updates: withTimestamp
      }, 'MatchService');

      return response as unknown as Match;
    } catch (error) {
      console.error(`Error updating match ${matchId}:`, error);
      throw error;
    }
  }

  /**
   * Update match score
   */
  async updateMatchScore(matchId: string, scores: MatchScore): Promise<Match> {
    try {
      const match = await this.getMatch(matchId);
      
      // Update match with new scores
      const updatedMatch = await this.updateMatch(matchId, {
        scores,
        status: scores.isComplete ? 'completed' : 'in_progress',
        winner_id: scores.isComplete && scores.winner 
          ? (scores.winner === 1 ? match.team1_id : match.team2_id) 
          : undefined,
        end_time: scores.isComplete ? new Date().toISOString() : undefined,
        ...(match.status === 'scheduled' ? { start_time: new Date().toISOString() } : {})
      });

      // Emit score updated event
      eventBus.emit(EventType.MATCH_SCORE_UPDATED, {
        matchId,
        tournamentId: match.tournament_id,
        score: scores
      }, 'MatchService');
      
      // If match is completed, emit match completed event
      if (scores.isComplete && !match.scores?.isComplete) {
        eventBus.emit(EventType.MATCH_COMPLETED, {
          matchId,
          tournamentId: match.tournament_id,
          score: scores,
          winnerId: scores.winner === 1 ? match.team1_id : match.team2_id
        }, 'MatchService');
      }

      return updatedMatch;
    } catch (error) {
      console.error(`Error updating score for match ${matchId}:`, error);
      throw error;
    }
  }

  /**
   * Assign a court to a match
   */
  async assignCourt(matchId: string, courtId: string, startTime?: string): Promise<Match> {
    try {
      const match = await this.getMatch(matchId);
      
      const updatedMatch = await this.updateMatch(matchId, {
        court_id: courtId,
        scheduled_time: startTime || match.scheduled_time
      });

      // Emit court assignment event
      eventBus.emit(EventType.MATCH_COURT_ASSIGNED, {
        matchId,
        tournamentId: match.tournament_id,
        courtId,
        scheduledTime: startTime || match.scheduled_time
      }, 'MatchService');

      return updatedMatch;
    } catch (error) {
      console.error(`Error assigning court for match ${matchId}:`, error);
      throw error;
    }
  }

  /**
   * Complete a match
   */
  async completeMatch(matchId: string, winnerId?: string): Promise<Match> {
    try {
      const match = await this.getMatch(matchId);
      
      // If winner not explicitly provided, determine from scores
      let determinedWinnerId = winnerId;
      
      if (!determinedWinnerId && match.scores?.isComplete && match.scores.winner) {
        determinedWinnerId = match.scores.winner === 1 ? match.team1_id : match.team2_id;
      }
      
      const updatedMatch = await this.updateMatch(matchId, {
        status: 'completed',
        end_time: new Date().toISOString(),
        winner_id: determinedWinnerId
      });

      // Emit match completed event
      eventBus.emit(EventType.MATCH_COMPLETED, {
        matchId,
        tournamentId: match.tournament_id,
        winnerId: determinedWinnerId
      }, 'MatchService');

      return updatedMatch;
    } catch (error) {
      console.error(`Error completing match ${matchId}:`, error);
      throw error;
    }
  }

  /**
   * Start a match
   */
  async startMatch(matchId: string): Promise<Match> {
    try {
      const match = await this.getMatch(matchId);
      
      const updatedMatch = await this.updateMatch(matchId, {
        status: 'in_progress',
        start_time: new Date().toISOString()
      });

      // Emit match started event
      eventBus.emit(EventType.MATCH_STARTED, {
        matchId,
        tournamentId: match.tournament_id,
        startTime: updatedMatch.start_time
      }, 'MatchService');

      return updatedMatch;
    } catch (error) {
      console.error(`Error starting match ${matchId}:`, error);
      throw error;
    }
  }

  /**
   * Cancel a match
   */
  async cancelMatch(matchId: string, reason?: string): Promise<Match> {
    try {
      const match = await this.getMatch(matchId);
      
      const updatedMatch = await this.updateMatch(matchId, {
        status: 'cancelled',
        notes: reason ? `Cancelled: ${reason}` : match.notes
      });

      // Emit match cancelled event
      eventBus.emit(EventType.MATCH_CANCELLED, {
        matchId,
        tournamentId: match.tournament_id,
        reason
      }, 'MatchService');

      return updatedMatch;
    } catch (error) {
      console.error(`Error cancelling match ${matchId}:`, error);
      throw error;
    }
  }

  /**
   * Create an empty score based on sport rules
   */
  createEmptyScore(sportType: string, formatId?: string): MatchScore {
    const sportRules = SportRulesFactory.createRules(sportType, formatId);
    
    if (!sportRules) {
      // Default score if sport rules not found
      return {
        sets: [{ team1Score: 0, team2Score: 0, isComplete: false }],
        isComplete: false
      };
    }
    
    return sportRules.createEmptyScore(formatId);
  }
  
  /**
   * Get available courts for a tournament at a specific time
   */
  async getAvailableCourts(
    tournamentId: string,
    targetTime?: string,
    duration?: number // in minutes
  ): Promise<CourtAssignment[]> {
    try {
      // First get all courts for the tournament
      const courtsResponse = await databases.listDocuments(
        process.env.VITE_APPWRITE_DATABASE_ID!,
        COLLECTIONS.COURTS,
        [databases.Query.equal('tournament_id', tournamentId)]
      );
      
      const allCourts = courtsResponse.documents;
      
      // If no specific time provided, return all courts with their current status
      if (!targetTime) {
        // Get matches that are currently using courts
        const activeMatches = await this.getMatches({
          tournament_id: tournamentId,
          status: 'in_progress'
        });
        
        // Create court assignments with current status
        return allCourts.map(court => {
          const activeMatch = activeMatches.find(match => match.court_id === court.$id);
          
          return {
            court_id: court.$id,
            court_number: court.number,
            court_name: court.name,
            match_id: activeMatch?.id || '',
            start_time: activeMatch?.start_time || '',
            status: activeMatch ? 'occupied' : (court.status || 'available')
          };
        });
      }
      
      // For scheduling, find courts available at the specified time
      const timeToCheck = new Date(targetTime);
      const endTimeToCheck = new Date(timeToCheck.getTime() + (duration || 60) * 60000); // default to 60 mins
      
      // Get matches that overlap with the requested time slot
      const overlappingMatches = await databases.listDocuments(
        process.env.VITE_APPWRITE_DATABASE_ID!,
        COLLECTIONS.MATCHES,
        [
          databases.Query.equal('tournament_id', tournamentId),
          databases.Query.notEqual('status', 'cancelled'),
          databases.Query.lessThan('scheduled_time', endTimeToCheck.toISOString()),
          databases.Query.greaterThan('scheduled_end_time', timeToCheck.toISOString()),
        ]
      );
      
      // Create court assignments with availability at the specified time
      return allCourts.map(court => {
        const overlappingMatch = (overlappingMatches.documents as unknown as Match[])
          .find(match => match.court_id === court.$id);
        
        return {
          court_id: court.$id,
          court_number: court.number,
          court_name: court.name,
          match_id: overlappingMatch?.id || '',
          start_time: overlappingMatch?.scheduled_time || '',
          end_time: overlappingMatch?.scheduled_end_time || '',
          status: overlappingMatch ? 'occupied' : (court.status || 'available')
        };
      });
    } catch (error) {
      console.error('Error fetching available courts:', error);
      throw error;
    }
  }
}

// Create and export a singleton instance
export const enhancedMatchService = new EnhancedMatchService();
