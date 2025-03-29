
import { Tournament, Court, Match, Team } from "@/types/tournament";
import { autoAssignCourts } from "@/utils/courtUtils";

export interface SchedulingOptions {
  date: Date;
  startTime: string;
  matchDuration: number;
  assignCourts: boolean;
  categoryId?: string;
  division?: string;
}

export interface SchedulingResult {
  scheduledMatches: number;
  assignedCourts: number;
  tournament: Tournament;
}

/**
 * Service for tournament match scheduling and court assignment
 */
export const schedulingService = {
  /**
   * Schedules matches and optionally assigns courts in a single operation
   * @param tournament The tournament to schedule matches for
   * @param teamPairs Array of team pairs to schedule
   * @param options Scheduling configuration options
   */
  scheduleMatches(
    tournament: Tournament,
    teamPairs: { team1: Team; team2: Team }[],
    options: SchedulingOptions
  ): SchedulingResult {
    if (!tournament || teamPairs.length === 0) {
      return {
        scheduledMatches: 0,
        assignedCourts: 0,
        tournament: tournament
      };
    }
    
    console.log(`[DEBUG] Scheduling ${teamPairs.length} matches with options:`, options);
    
    // Collect available courts if court assignment is requested
    const availableCourts = options.assignCourts 
      ? tournament.courts.filter(c => c.status === "AVAILABLE")
      : [];
    
    // Parse the starting date and time
    const baseDateTime = new Date(`${options.date.toISOString().split('T')[0]}T${options.startTime}`);
    
    let updatedTournament = { ...tournament };
    let scheduledCount = 0;
    let assignedCourtCount = 0;
    
    // Schedule as many matches as possible
    const maxInitialMatches = options.assignCourts 
      ? Math.min(availableCourts.length, teamPairs.length)
      : teamPairs.length;
    
    // Create new matches array to add to tournament
    const newMatches: Match[] = [];
    
    // First, schedule matches on all available courts if requested
    for (let i = 0; i < maxInitialMatches; i++) {
      const { team1, team2 } = teamPairs[i];
      
      // Calculate match time (staggered by 5 minutes to prevent exact same time)
      const matchTime = new Date(baseDateTime);
      matchTime.setMinutes(matchTime.getMinutes() + (i * 5));
      
      // Create the match
      const newMatch: Match = {
        id: crypto.randomUUID(),
        tournamentId: tournament.id,
        team1: team1,
        team2: team2,
        scores: [],
        division: options.division || "INITIAL",
        stage: tournament.currentStage,
        status: "SCHEDULED",
        scheduledTime: matchTime,
        category: options.categoryId 
          ? tournament.categories.find(c => c.id === options.categoryId)! 
          : tournament.categories[0],
      };
      
      // Assign court if available and requested
      if (options.assignCourts && i < availableCourts.length) {
        const courtId = availableCourts[i].id;
        const court = tournament.courts.find(c => c.id === courtId)!;
        newMatch.courtNumber = court.number;
        assignedCourtCount++;
      }
      
      newMatches.push(newMatch);
      scheduledCount++;
    }
    
    // Then, create additional scheduled matches without courts
    for (let i = maxInitialMatches; i < teamPairs.length; i++) {
      const { team1, team2 } = teamPairs[i];
      
      // Calculate match time - add match duration minutes for each group of matches
      const groupIndex = Math.floor(i / (availableCourts.length || 1));
      const matchTime = new Date(baseDateTime);
      matchTime.setMinutes(
        matchTime.getMinutes() + 
        (groupIndex * options.matchDuration) + 
        (i * 5)
      );
      
      // Create the match without a court
      const newMatch: Match = {
        id: crypto.randomUUID(),
        tournamentId: tournament.id,
        team1: team1,
        team2: team2,
        scores: [],
        division: options.division || "INITIAL",
        stage: tournament.currentStage,
        status: "SCHEDULED",
        scheduledTime: matchTime,
        category: options.categoryId 
          ? tournament.categories.find(c => c.id === options.categoryId)! 
          : tournament.categories[0],
      };
      
      newMatches.push(newMatch);
      scheduledCount++;
    }
    
    // Update the tournament with new matches
    updatedTournament = {
      ...updatedTournament,
      matches: [...updatedTournament.matches, ...newMatches],
      updatedAt: new Date()
    };
    
    return {
      scheduledMatches: scheduledCount,
      assignedCourts: assignedCourtCount,
      tournament: updatedTournament
    };
  },
  
  /**
   * Auto-assigns courts to scheduled matches that don't have courts
   * @param tournament The tournament to assign courts for
   */
  assignCourtsToScheduledMatches(tournament: Tournament): SchedulingResult {
    console.log('[DEBUG] Auto-assigning courts to scheduled matches');
    
    // Use the existing court assignment utility
    const result = autoAssignCourts(tournament);
    
    return {
      scheduledMatches: 0,
      assignedCourts: result.assignedCount,
      tournament: result.tournament
    };
  }
};
