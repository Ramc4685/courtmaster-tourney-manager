
import { Tournament, Court, Match, CourtStatus } from "@/types/tournament";
import { tournamentService } from "./TournamentService";
import { findMatchById, findCourtById } from "@/utils/tournamentUtils";

export class CourtService {
  // Assign court to match
  async assignCourt(
    tournamentId: string,
    matchId: string, 
    courtId: string
  ): Promise<Tournament | null> {
    const tournament = await tournamentService.getCurrentTournament();
    if (!tournament || tournament.id !== tournamentId) return null;
    
    const match = findMatchById(tournament, matchId);
    const court = findCourtById(tournament, courtId);
    
    if (!match || !court) return null;
    
    // Ensure court is available
    if (court.status !== "AVAILABLE") return null;
    
    // Update match with court number
    const updatedMatch = {
      ...match,
      courtNumber: court.number
    };
    
    // Update court status and current match
    const updatedCourt = {
      ...court,
      status: "IN_USE" as CourtStatus,
      currentMatch: updatedMatch
    };
    
    // Update both in the tournament
    const updatedMatches = tournament.matches.map(m => 
      m.id === updatedMatch.id ? updatedMatch : m
    );
    
    const updatedCourts = tournament.courts.map(c => 
      c.id === updatedCourt.id ? updatedCourt : c
    );
    
    const updatedTournament = {
      ...tournament,
      matches: updatedMatches,
      courts: updatedCourts,
      updatedAt: new Date()
    };
    
    await tournamentService.updateTournament(updatedTournament);
    return updatedTournament;
  }

  // Auto-assign available courts to scheduled matches
  async autoAssignCourts(tournamentId: string): Promise<{ assignedCount: number, tournament: Tournament | null }> {
    const tournament = await tournamentService.getCurrentTournament();
    if (!tournament || tournament.id !== tournamentId) {
      return { assignedCount: 0, tournament: null };
    }
    
    // Find available courts
    const availableCourts = tournament.courts.filter(court => court.status === "AVAILABLE");
    if (availableCourts.length === 0) {
      return { assignedCount: 0, tournament };
    }
    
    // Find scheduled matches without courts
    const scheduledMatches = tournament.matches.filter(
      match => match.status === "SCHEDULED" && !match.courtNumber
    );
    
    if (scheduledMatches.length === 0) {
      return { assignedCount: 0, tournament };
    }
    
    // Limit assignments to available courts count
    const matchesToAssign = scheduledMatches.slice(0, availableCourts.length);
    let updatedTournament = { ...tournament };
    
    // Assign courts to matches
    for (let i = 0; i < matchesToAssign.length; i++) {
      const match = matchesToAssign[i];
      const court = availableCourts[i];
      
      // Update match with court number
      const updatedMatch = {
        ...match,
        courtNumber: court.number
      };
      
      // Update court status and current match
      const updatedCourt = {
        ...court,
        status: "IN_USE" as CourtStatus,
        currentMatch: updatedMatch
      };
      
      // Update both in the tournament
      updatedTournament.matches = updatedTournament.matches.map(m => 
        m.id === updatedMatch.id ? updatedMatch : m
      );
      
      updatedTournament.courts = updatedTournament.courts.map(c => 
        c.id === updatedCourt.id ? updatedCourt : c
      );
    }
    
    updatedTournament.updatedAt = new Date();
    
    await tournamentService.updateTournament(updatedTournament);
    return { assignedCount: matchesToAssign.length, tournament: updatedTournament };
  }
}

// Create a singleton instance
export const courtService = new CourtService();
