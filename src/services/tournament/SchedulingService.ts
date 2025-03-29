
import { Tournament, Court, Match, Team, Division, MatchStatus, CourtStatus } from "@/types/tournament";
import { autoAssignCourts } from "@/utils/courtUtils";

export interface SchedulingOptions {
  date: Date;
  startTime: string;
  matchDuration: number;
  assignCourts: boolean;
  autoStartMatches?: boolean; // New option to auto-start matches if courts are available
  categoryId?: string;
  division?: Division;
}

export interface SchedulingResult {
  scheduledMatches: number;
  assignedCourts: number;
  startedMatches?: number; // New field for number of matches started
  tournament: Tournament;
}

/**
 * Service for tournament match scheduling and court assignment
 */
export const schedulingService = {
  /**
   * Schedules matches, assigns courts, and optionally starts matches in a single operation
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
        startedMatches: 0,
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
    let startedMatchCount = 0;
    
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
      
      // Use the division from options, defaulting to "INITIAL" if not provided
      const division: Division = options.division || "INITIAL";
      
      // Create the match - with the option to auto-start it
      const newMatch: Match = {
        id: crypto.randomUUID(),
        tournamentId: tournament.id,
        team1: team1,
        team2: team2,
        scores: [],
        division: division,
        stage: tournament.currentStage,
        status: options.autoStartMatches && i < availableCourts.length ? "IN_PROGRESS" as MatchStatus : "SCHEDULED" as MatchStatus,
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
        
        // If auto-start is enabled, mark the match as started
        if (options.autoStartMatches) {
          startedMatchCount++;
        }
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
      
      // Use the division from options, defaulting to "INITIAL" if not provided
      const division: Division = options.division || "INITIAL";
      
      // Create the match without a court
      const newMatch: Match = {
        id: crypto.randomUUID(),
        tournamentId: tournament.id,
        team1: team1,
        team2: team2,
        scores: [],
        division: division,
        stage: tournament.currentStage,
        status: "SCHEDULED" as MatchStatus,
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
    
    // If auto-starting matches, update court statuses
    if (options.autoStartMatches && assignedCourtCount > 0) {
      // Update court statuses for courts that have been assigned to started matches
      updatedTournament = {
        ...updatedTournament,
        courts: updatedTournament.courts.map(court => {
          const matchUsingCourt = newMatches.find(
            m => m.courtNumber === court.number && m.status === "IN_PROGRESS"
          );
          
          if (matchUsingCourt) {
            return {
              ...court,
              status: "IN_USE" as CourtStatus,
              currentMatch: matchUsingCourt
            };
          }
          
          return court;
        })
      };
    }
    
    return {
      scheduledMatches: scheduledCount,
      assignedCourts: assignedCourtCount,
      startedMatches: startedMatchCount,
      tournament: updatedTournament
    };
  },
  
  /**
   * Auto-assigns courts to scheduled matches that don't have courts
   * @param tournament The tournament to assign courts for
   * @returns Promise with tournament and assignment results
   */
  async assignCourtsToScheduledMatches(tournament: Tournament): Promise<SchedulingResult> {
    console.log('[DEBUG] Auto-assigning courts to scheduled matches');
    
    // Use the existing court assignment utility
    const result = await autoAssignCourts(tournament);
    
    return {
      scheduledMatches: 0,
      assignedCourts: result.assignedCount,
      tournament: result.tournament
    };
  },
  
  /**
   * Start a match and assign it to an available court if possible
   * @param tournament The tournament
   * @param matchId The match ID to start
   * @param forceStart Whether to start the match even if no courts are available
   * @returns The updated tournament and whether the match was started
   */
  startMatch(
    tournament: Tournament, 
    matchId: string, 
    forceStart: boolean = false
  ): {tournament: Tournament, started: boolean} {
    // Find the match
    const match = tournament.matches.find(m => m.id === matchId);
    if (!match || match.status !== "SCHEDULED") {
      return { tournament, started: false };
    }
    
    // Check if the match already has a court assigned
    if (match.courtNumber) {
      // Update match status and court status
      const updatedTournament = {
        ...tournament,
        matches: tournament.matches.map(m => 
          m.id === matchId 
            ? { ...m, status: "IN_PROGRESS" as MatchStatus } 
            : m
        ),
        courts: tournament.courts.map(c => 
          c.number === match.courtNumber 
            ? { 
                ...c, 
                status: "IN_USE" as CourtStatus, 
                currentMatch: { ...match, status: "IN_PROGRESS" as MatchStatus }
              } 
            : c
        ),
        updatedAt: new Date()
      };
      
      return { tournament: updatedTournament, started: true };
    }
    
    // If no court is assigned, try to find an available court
    const availableCourt = tournament.courts.find(c => c.status === "AVAILABLE");
    
    if (availableCourt) {
      // Assign the available court and start the match
      const updatedTournament = {
        ...tournament,
        matches: tournament.matches.map(m => 
          m.id === matchId 
            ? { 
                ...m, 
                status: "IN_PROGRESS" as MatchStatus,
                courtNumber: availableCourt.number
              } 
            : m
        ),
        courts: tournament.courts.map(c => 
          c.id === availableCourt.id 
            ? { 
                ...c, 
                status: "IN_USE" as CourtStatus, 
                currentMatch: { 
                  ...match, 
                  status: "IN_PROGRESS" as MatchStatus,
                  courtNumber: availableCourt.number
                }
              } 
            : c
        ),
        updatedAt: new Date()
      };
      
      return { tournament: updatedTournament, started: true };
    }
    
    // If no courts are available but forceStart is true, start the match anyway
    if (forceStart) {
      const updatedTournament = {
        ...tournament,
        matches: tournament.matches.map(m => 
          m.id === matchId 
            ? { ...m, status: "IN_PROGRESS" as MatchStatus } 
            : m
        ),
        updatedAt: new Date()
      };
      
      return { tournament: updatedTournament, started: true };
    }
    
    // No court available and not forcing start
    return { tournament, started: false };
  },
  
  /**
   * Check if there are any scheduled matches that can be started when a court becomes available
   * This function would be called when a match is completed and a court becomes available
   * @param tournament The tournament
   * @returns The updated tournament with any new matches started
   */
  startNextScheduledMatch(tournament: Tournament): {tournament: Tournament, started: boolean} {
    // Find the next scheduled match
    const scheduledMatch = tournament.matches.find(
      m => m.status === "SCHEDULED" && !m.courtNumber
    );
    
    if (!scheduledMatch) {
      return { tournament, started: false };
    }
    
    // Try to start the match
    return this.startMatch(tournament, scheduledMatch.id);
  }
};
