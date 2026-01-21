import { Tournament, Team, TournamentFormat, Match, Court, TournamentCategory } from "@/types/tournament";
import { TournamentStatus, MatchStatus, Division, CategoryType } from "@/types/tournament-enums";
import { findCourtById, findMatchById, generateId } from "@/utils/tournamentUtils";
import { databases, APPWRITE_DATABASE_ID } from '@/lib/appwrite';
import { COLLECTIONS } from '@/lib/appwrite';
import { Query } from 'appwrite';
import { TournamentFormatService } from './formats/TournamentFormatService';

export interface SchedulingOptions {
  startDate: Date;
  startTime: string;
  matchDuration: number;
  breakDuration: number;
  assignCourts: boolean;
  autoStartMatches: boolean;
  respectFormat: boolean;
  optimizeCourts?: boolean;
  distributeMatches?: boolean; // Distribute matches evenly across courts
  allowOverlap?: boolean; // Allow overlapping matches on the same court
}

export interface SchedulingResult {
  tournament: Tournament;
  matchesScheduled: number;
  courtsAssigned: number;
  matchesStarted: number;
  errors?: string[];
}

class SchedulingService {
  private calculateCourtEfficiency(court: Court, matches: Match[]): number {
    const matchesOnCourt = matches.filter(m => m.courtNumber === court.number);
    return matchesOnCourt.length;
  }

  private findOptimalCourt(courts: Court[], match: Match, matches: Match[]): Court | null {
    return courts
      .filter(c => c.status === "AVAILABLE")
      .reduce((best, current) => {
        const currentEfficiency = this.calculateCourtEfficiency(current, matches);
        const bestEfficiency = best ? this.calculateCourtEfficiency(best, matches) : -1;
        return currentEfficiency > bestEfficiency ? current : best;
      }, null as Court | null);
  }

  // Generate brackets for a tournament
  async generateBrackets(tournament: Tournament): Promise<{ tournament: Tournament; matchesCreated: number }> {
    console.log("Generating brackets for tournament:", tournament.name);

    const format = tournament.format || TournamentFormat.SINGLE_ELIMINATION;
    const formatHandler = TournamentFormatService.getFormatHandler(format);
    const allMatches: Match[] = [];

    // Generate brackets for each category
    for (const category of tournament.categories || []) {
      // Get teams assigned to this category
      const teamsInCategory = (tournament.teams || []).filter(t =>
        t.categoryId === category.id ||
        (t.category && t.category.id === category.id)
      );

      console.log(`Category ${category.name}: ${teamsInCategory.length} teams`);

      if (teamsInCategory.length >= 2) {
        // Generate matches using the format handler
        const matches = formatHandler.generateBracket(teamsInCategory, undefined, category);

        // Set tournament ID and category on all matches
        matches.forEach(m => {
          m.tournamentId = tournament.id;
          m.category = category;
          m.categoryId = category.id;
          // Ensure match has a unique ID if not already set
          if (!m.id || m.id === '') {
            m.id = generateId();
          }
        });

        allMatches.push(...matches);
        console.log(`Generated ${matches.length} matches for category ${category.name}`);
      } else {
        console.log(`Skipping category ${category.name}: not enough teams (${teamsInCategory.length})`);
      }
    }

    // If no categories, try generating for all teams as a single bracket
    if ((tournament.categories || []).length === 0 && (tournament.teams || []).length >= 2) {
      console.log("No categories found, generating single bracket for all teams");
      const defaultCategory: TournamentCategory = {
        id: generateId(),
        name: "Main",
        type: CategoryType.OPEN,
        division: Division.OPEN
      };

      const matches = formatHandler.generateBracket(tournament.teams, undefined, defaultCategory);
      matches.forEach(m => {
        m.tournamentId = tournament.id;
        m.category = defaultCategory;
        if (!m.id || m.id === '') {
          m.id = generateId();
        }
      });

      allMatches.push(...matches);
      console.log(`Generated ${matches.length} matches for default bracket`);
    }

    if (allMatches.length === 0) {
      console.warn("No matches generated - ensure teams are assigned to categories");
      return {
        tournament,
        matchesCreated: 0
      };
    }

    // Update tournament with new matches and set status to IN_PROGRESS
    const updatedTournament: Tournament = {
      ...tournament,
      matches: [...(tournament.matches || []), ...allMatches],
      status: TournamentStatus.IN_PROGRESS,
      updatedAt: new Date()
    };

    console.log(`Total matches generated: ${allMatches.length}`);

    return {
      tournament: updatedTournament,
      matchesCreated: allMatches.length
    };
  }
  
  // Assign courts to scheduled matches
  async assignCourtsToScheduledMatches(
    tournament: Tournament,
    options: { optimizeCourts?: boolean; distributeMatches?: boolean } = {}
  ): Promise<{ tournament: Tournament; assignedCourts: number }> {
    console.log("Assigning courts for tournament:", tournament.name);
    
    const scheduledMatches = tournament.matches
      .filter(m => m.status === "SCHEDULED" && !m.courtId)
      .sort((a, b) => (a.scheduledTime?.getTime() || 0) - (b.scheduledTime?.getTime() || 0));
      
    const availableCourts = tournament.courts.filter(c => c.status === "AVAILABLE");
    let assignedCount = 0;
    
    // If no available courts, return early
    if (availableCourts.length === 0) {
      return {
        tournament,
        assignedCourts: 0
      };
    }
    
    for (const match of scheduledMatches) {
      let selectedCourt: Court | null = null;
      
      if (options.optimizeCourts) {
        // Find optimal court based on utilization
        selectedCourt = this.findOptimalCourt(availableCourts, match, tournament.matches);
      } else if (options.distributeMatches) {
        // Distribute matches evenly across courts
        const courtAssignments = new Map<string, number>();
        
        // Count current assignments
        tournament.matches.forEach(m => {
          if (m.courtId) {
            courtAssignments.set(
              m.courtId, 
              (courtAssignments.get(m.courtId) || 0) + 1
            );
          }
        });
        
        // Find court with fewest matches
        selectedCourt = availableCourts.reduce((best, current) => {
          const currentCount = courtAssignments.get(current.id) || 0;
          const bestCount = best ? courtAssignments.get(best.id) || 0 : Infinity;
          
          return currentCount < bestCount ? current : best;
        }, null as Court | null);
      } else {
        // Simple assignment - just take first available court
        selectedCourt = availableCourts[0];
      }
      
      if (selectedCourt) {
        match.courtId = selectedCourt.id;
        match.courtNumber = selectedCourt.courtNumber || selectedCourt.number;
        assignedCount++;
      }
    }
    
    return {
      tournament,
      assignedCourts: assignedCount
    };
  }
  
  // Schedule a single match
  async scheduleMatch(
    tournament: Tournament,
    team1Id: string,
    team2Id: string,
    scheduledTime: Date,
    courtId?: string,
    categoryId?: string
  ): Promise<{ tournament: Tournament; match: Match }> {
    // Implementation would go here
    console.log("Scheduling match in tournament:", tournament.name);
    
    // For now, just return the tournament with no changes
    return {
      tournament,
      match: {} as Match
    };
  }
  
  // Schedule multiple matches
  async scheduleMatches(
    tournament: Tournament,
    teamPairs: { team1: Team; team2: Team }[],
    options: SchedulingOptions
  ): Promise<SchedulingResult> {
    const result: SchedulingResult = {
      tournament: { ...tournament },
      matchesScheduled: 0,
      courtsAssigned: 0,
      matchesStarted: 0,
      errors: []
    };

    let currentTime = new Date(options.startDate);
    currentTime.setHours(parseInt(options.startTime.split(':')[0]));
    currentTime.setMinutes(parseInt(options.startTime.split(':')[1]));

    for (const pair of teamPairs) {
      const match: Match = {
        id: `match-${Date.now()}-${Math.random()}`,
        team1Id: pair.team1.id,
        team2Id: pair.team2.id,
        status: "SCHEDULED",
        scheduledTime: new Date(currentTime),
        scores: [],
        createdAt: new Date()
      };

      if (options.assignCourts && options.optimizeCourts) {
        const optimalCourt = this.findOptimalCourt(tournament.courts, match, result.tournament.matches);
        if (optimalCourt) {
          match.courtNumber = optimalCourt.number;
          result.courtsAssigned++;
        }
      }

      result.tournament.matches.push(match);
      result.matchesScheduled++;

      currentTime = new Date(currentTime.getTime() + (options.matchDuration + options.breakDuration) * 60000);
    }

    return result;
  }
  
  // Start a match
  async startMatch(
    tournament: Tournament,
    matchId: string,
    forceStart?: boolean
  ): Promise<{ tournament: Tournament; started: boolean }> {
    console.log("Starting match in tournament:", tournament.name);
    
    const match = tournament.matches.find(m => m.id === matchId);
    if (!match) {
      throw new Error(`Match with ID ${matchId} not found`);
    }
    
    // Check if court is available
    let canStart = !!forceStart;
    
    if (!canStart && match.courtId) {
      const court = tournament.courts.find(c => c.id === match.courtId);
      if (court && court.status === "AVAILABLE") {
        canStart = true;
      }
    }
    
    if (canStart) {
      match.status = "IN_PROGRESS";
      match.startTime = match.startTime || new Date().toISOString();
      
      // If match has a court, update court status
      if (match.courtId) {
        const court = tournament.courts.find(c => c.id === match.courtId);
        if (court) {
          court.status = "IN_USE";
          court.currentMatch = matchId;
        }
      }
      
      return {
        tournament,
        started: true
      };
    }
    
    return {
      tournament,
      started: false
    };
  }
  
  // Generate a multi-stage tournament
  async generateMultiStageTournament(
    tournament: Tournament
  ): Promise<{ tournament: Tournament }> {
    // Implementation would go here
    console.log("Generating multi-stage tournament:", tournament.name);
    
    // For now, just return the tournament with no changes
    return { tournament };
  }
  
  // Advance tournament to next stage
  async advanceToNextStage(
    tournament: Tournament
  ): Promise<{ tournament: Tournament }> {
    // Implementation would go here
    console.log("Advancing tournament to next stage:", tournament.name);
    
    // For now, just return the tournament with no changes
    return { tournament };
  }
  
  // Load sample data
  async loadSampleData(
    tournament: Tournament,
    format?: TournamentFormat
  ): Promise<{ tournament: Tournament }> {
    // Implementation would go here
    console.log("Loading sample data for tournament:", tournament.name);
    
    // For now, just return the tournament with no changes
    return { tournament };
  }
  
  // Load category demo data
  async loadCategoryDemoData(
    tournament: Tournament,
    categoryId: string,
    format: TournamentFormat
  ): Promise<{ tournament: Tournament }> {
    // Implementation would go here
    console.log("Loading category demo data for tournament:", tournament.name);
    
    // For now, just return the tournament with no changes
    return { tournament };
  }

  async optimizeExistingSchedule(tournament: Tournament): Promise<Tournament> {
    const scheduledMatches = tournament.matches
      .filter(m => m.status === "SCHEDULED")
      .sort((a, b) => (a.scheduledTime?.getTime() || 0) - (b.scheduledTime?.getTime() || 0));

    const availableCourts = tournament.courts.filter(c => c.status === "AVAILABLE");

    for (const match of scheduledMatches) {
      const optimalCourt = this.findOptimalCourt(availableCourts, match, tournament.matches);
      if (optimalCourt) {
        match.courtNumber = optimalCourt.number;
        match.courtId = optimalCourt.id;
      }
    }

    return tournament;
  }
  
  // New methods for drag-and-drop court assignment

  /**
   * Assign a match to a court with drag-and-drop functionality
   * @param matchId The ID of the match to assign
   * @param courtId The ID of the court to assign the match to
   * @returns Promise resolving to the updated match and court
   */
  async assignMatchToCourt(
    matchId: string,
    courtId: string
  ): Promise<{ match: Match; court: Court }> {
    try {
      // Get the match and court from the database
      const matchDoc = await databases.getDocument(
        APPWRITE_DATABASE_ID,
        COLLECTIONS.MATCHES,
        matchId
      );
      
      const courtDoc = await databases.getDocument(
        APPWRITE_DATABASE_ID,
        COLLECTIONS.COURTS,
        courtId
      );
      
      // Update the match with the court ID
      const updatedMatch = await databases.updateDocument(
        APPWRITE_DATABASE_ID,
        COLLECTIONS.MATCHES,
        matchId,
        {
          courtId,
          courtNumber: courtDoc.number,
          updatedAt: new Date()
        }
      );
      
      // Update the court status and current match
      const updatedCourt = await databases.updateDocument(
        APPWRITE_DATABASE_ID,
        COLLECTIONS.COURTS,
        courtId,
        {
          status: "IN_USE",
          currentMatch: matchId,
          updatedAt: new Date()
        }
      );
      
      return {
        match: updatedMatch as Match,
        court: updatedCourt as Court
      };
    } catch (error) {
      console.error('Error assigning match to court:', error);
      throw error;
    }
  }

  /**
   * Remove a match assignment from a court
   * @param courtId The ID of the court to clear
   * @returns Promise resolving to the updated court
   */
  async clearCourtAssignment(courtId: string): Promise<Court> {
    try {
      // Get the court to find the current match
      const courtDoc = await databases.getDocument(
        APPWRITE_DATABASE_ID,
        COLLECTIONS.COURTS,
        courtId
      );
      
      // If there's a match assigned to this court, update it
      if (courtDoc.currentMatch) {
        try {
          await databases.updateDocument(
            APPWRITE_DATABASE_ID,
            COLLECTIONS.MATCHES,
            courtDoc.currentMatch,
            {
              courtId: null,
              courtNumber: null,
              updatedAt: new Date()
            }
          );
        } catch (e) {
          // Match might have been deleted, continue
          console.log('Could not update match, it may have been deleted');
        }
      }
      
      // Update the court
      const updatedCourt = await databases.updateDocument(
        APPWRITE_DATABASE_ID,
        COLLECTIONS.COURTS,
        courtId,
        {
          status: "AVAILABLE",
          currentMatch: null,
          updatedAt: new Date()
        }
      );
      
      return updatedCourt as Court;
    } catch (error) {
      console.error('Error clearing court assignment:', error);
      throw error;
    }
  }

  /**
   * Get scheduled matches that don't have courts assigned
   * @param tournamentId Tournament ID
   * @returns Array of unassigned matches
   */
  async getUnassignedMatches(tournamentId: string): Promise<Match[]> {
    try {
      const response = await databases.listDocuments(
        APPWRITE_DATABASE_ID,
        COLLECTIONS.MATCHES,
        [
          Query.equal('tournamentId', tournamentId),
          Query.isNull('courtId'),
          Query.equal('status', 'SCHEDULED'),
          Query.orderAsc('scheduledTime')
        ]
      );
      
      return response.documents as Match[];
    } catch (error) {
      console.error('Error getting unassigned matches:', error);
      throw error;
    }
  }
}

export const schedulingService = new SchedulingService();