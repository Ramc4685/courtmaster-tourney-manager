
import { Tournament, Match, Court } from '@/types/tournament';
import { CourtStatus } from '@/types/tournament-enums';
import { tournamentService } from './TournamentService';
import { findMatchById, findCourtById } from '@/utils/tournamentUtils';

export type CourtAssignmentErrorCode =
  | 'TOURNAMENT_NOT_FOUND'
  | 'MATCH_NOT_FOUND'
  | 'COURT_NOT_FOUND'
  | 'COURT_IN_USE'
  | 'COURT_IN_MAINTENANCE'
  | 'MATCH_ALREADY_ASSIGNED';

export class CourtAssignmentError extends Error {
  constructor(public code: CourtAssignmentErrorCode, message: string) {
    super(message);
    this.name = 'CourtAssignmentError';
  }
}

export class CourtService {
  // Assign court to match
  async assignCourt(
    tournamentId: string,
    matchId: string,
    courtId: string
  ): Promise<Tournament> {
    const tournament = await tournamentService.getCurrentTournament();

    if (!tournament || tournament.id !== tournamentId) {
      throw new CourtAssignmentError('TOURNAMENT_NOT_FOUND', 'Tournament could not be found.');
    }

    const match = findMatchById(tournament, matchId);
    if (!match) {
      throw new CourtAssignmentError('MATCH_NOT_FOUND', 'Match could not be found.');
    }

    if (match.courtId && match.courtId !== courtId) {
      throw new CourtAssignmentError('MATCH_ALREADY_ASSIGNED', 'Match is already assigned to another court.');
    }

    const court = findCourtById(tournament, courtId);
    if (!court) {
      throw new CourtAssignmentError('COURT_NOT_FOUND', 'Court could not be found.');
    }

    if (court.status === 'MAINTENANCE') {
      throw new CourtAssignmentError('COURT_IN_MAINTENANCE', 'Court is currently under maintenance.');
    }

    if (court.status === 'IN_USE' && court.currentMatch?.id !== matchId) {
      throw new CourtAssignmentError('COURT_IN_USE', 'Court is already in use.');
    }

    const updatedMatch: Match = {
      ...match,
      courtNumber: court.number,
      courtId
    };

    const updatedCourt: Court = {
      ...court,
      status: 'IN_USE' as CourtStatus,
      currentMatch: updatedMatch
    };

    const updatedTournament: Tournament = {
      ...tournament,
      matches: tournament.matches.map(existingMatch =>
        existingMatch.id === updatedMatch.id ? updatedMatch : existingMatch
      ),
      courts: tournament.courts.map(existingCourt =>
        existingCourt.id === updatedCourt.id ? updatedCourt : existingCourt
      ),
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
    const updatedTournament = { ...tournament };
    
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

  async releaseCourt(
    tournamentId: string,
    matchId: string
  ): Promise<Tournament> {
    const tournament = await tournamentService.getCurrentTournament();

    if (!tournament || tournament.id !== tournamentId) {
      throw new CourtAssignmentError('TOURNAMENT_NOT_FOUND', 'Tournament could not be found.');
    }

    const match = findMatchById(tournament, matchId);
    if (!match) {
      throw new CourtAssignmentError('MATCH_NOT_FOUND', 'Match could not be found.');
    }

    if (!match.courtId && !match.courtNumber) {
      return tournament;
    }

    const court = match.courtId
      ? findCourtById(tournament, match.courtId)
      : tournament.courts.find(existingCourt => existingCourt.number === match.courtNumber);

    if (!court) {
      throw new CourtAssignmentError('COURT_NOT_FOUND', 'Assigned court could not be found.');
    }

    const clearedMatch: Match = {
      ...match,
      courtId: undefined,
      courtNumber: undefined
    };

    const clearedCourt: Court = {
      ...court,
      status: 'AVAILABLE' as CourtStatus,
      currentMatch: undefined
    };

    const updatedTournament: Tournament = {
      ...tournament,
      matches: tournament.matches.map(existingMatch =>
        existingMatch.id === clearedMatch.id ? clearedMatch : existingMatch
      ),
      courts: tournament.courts.map(existingCourt =>
        existingCourt.id === clearedCourt.id ? clearedCourt : existingCourt
      ),
      updatedAt: new Date()
    };

    await tournamentService.updateTournament(updatedTournament);
    return updatedTournament;
  }
}

// Create a singleton instance
export const courtService = new CourtService();
