import { Tournament, Team, TournamentFormat, Match, Court } from "@/types/tournament";
import { findCourtById, findMatchById } from "@/utils/tournamentUtils";

export interface SchedulingOptions {
  startDate: Date;
  startTime: string;
  matchDuration: number;
  breakDuration: number;
  assignCourts: boolean;
  autoStartMatches: boolean;
  respectFormat: boolean;
  optimizeCourts?: boolean;
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
    // Implementation would go here
    console.log("Generating brackets for tournament:", tournament.name);
    
    // For now, just return the tournament with no changes
    return {
      tournament,
      matchesCreated: 0
    };
  }
  
  // Assign courts to scheduled matches
  async assignCourtsToScheduledMatches(tournament: Tournament): Promise<{ tournament: Tournament; assignedCourts: number }> {
    // Implementation would go here
    console.log("Assigning courts for tournament:", tournament.name);
    
    // For now, just return the tournament with no changes
    return {
      tournament,
      assignedCourts: 0
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
    // Implementation would go here
    console.log("Starting match in tournament:", tournament.name);
    
    // For now, just return the tournament with no changes
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
      }
    }

    return tournament;
  }
}

export const schedulingService = new SchedulingService();