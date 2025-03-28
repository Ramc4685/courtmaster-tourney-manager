
import { Tournament, Match, MatchStatus, MatchScore } from "@/types/tournament";
import { tournamentService } from "./TournamentService";
import { findMatchById, findCourtByNumber } from "@/utils/tournamentUtils";
import { determineMatchWinnerAndLoser, updateBracketProgression, getDefaultScoringSettings } from "@/utils/matchUtils";

export class MatchService {
  // Update match score
  async updateMatchScore(
    tournamentId: string, 
    matchId: string, 
    setIndex: number, 
    team1Score: number, 
    team2Score: number
  ): Promise<Tournament | null> {
    const tournament = await tournamentService.getCurrentTournament();
    if (!tournament || tournament.id !== tournamentId) return null;
    
    const match = findMatchById(tournament, matchId);
    if (!match) return null;
    
    const updatedScores = [...match.scores];
    
    // Ensure we have enough sets
    while (updatedScores.length <= setIndex) {
      updatedScores.push({ team1Score: 0, team2Score: 0 });
    }
    
    // Update the score at the specified index
    updatedScores[setIndex] = { team1Score, team2Score };
    
    const updatedMatch = {
      ...match,
      scores: updatedScores
    };
    
    // Update the match in the tournament
    const updatedMatches = tournament.matches.map(m => 
      m.id === matchId ? updatedMatch : m
    );
    
    const updatedTournament = {
      ...tournament,
      matches: updatedMatches,
      updatedAt: new Date()
    };
    
    await tournamentService.updateTournament(updatedTournament);
    return updatedTournament;
  }

  // Update match status
  async updateMatchStatus(
    tournamentId: string,
    matchId: string, 
    status: MatchStatus
  ): Promise<Tournament | null> {
    const tournament = await tournamentService.getCurrentTournament();
    if (!tournament || tournament.id !== tournamentId) return null;
    
    const match = findMatchById(tournament, matchId);
    if (!match) return null;
    
    const updatedMatch = {
      ...match,
      status
    };
    
    // If the match is completed or cancelled, free up the court
    if ((status === "COMPLETED" || status === "CANCELLED") && match.courtNumber) {
      const courtToUpdate = findCourtByNumber(tournament, match.courtNumber);
      
      if (courtToUpdate) {
        const updatedCourt = {
          ...courtToUpdate,
          status: "AVAILABLE",
          currentMatch: undefined
        };
        
        const updatedCourts = tournament.courts.map(c => 
          c.id === courtToUpdate.id ? updatedCourt : c
        );
        
        const updatedMatches = tournament.matches.map(m => 
          m.id === matchId ? updatedMatch : m
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
    }
    
    // If no court update needed, just update the match
    const updatedMatches = tournament.matches.map(m => 
      m.id === matchId ? updatedMatch : m
    );
    
    const updatedTournament = {
      ...tournament,
      matches: updatedMatches,
      updatedAt: new Date()
    };
    
    await tournamentService.updateTournament(updatedTournament);
    return updatedTournament;
  }

  // Complete a match
  async completeMatch(
    tournamentId: string,
    matchId: string
  ): Promise<Tournament | null> {
    const tournament = await tournamentService.getCurrentTournament();
    if (!tournament || tournament.id !== tournamentId) return null;
    
    const match = findMatchById(tournament, matchId);
    if (!match) return null;
    
    // Get scoring settings
    const scoringSettings = tournament.scoringSettings || getDefaultScoringSettings();
    
    // Determine winner based on scores
    const result = determineMatchWinnerAndLoser(match, scoringSettings);
    if (!result) return null;
    
    const { winner, loser } = result;
    
    const updatedMatch = {
      ...match,
      status: "COMPLETED" as MatchStatus,
      winner,
      loser
    };
    
    // Update the match in the tournament
    let updatedTournament = { ...tournament };
    
    // Free up the court if assigned
    if (match.courtNumber) {
      const courtIndex = updatedTournament.courts.findIndex(c => c.number === match.courtNumber);
      if (courtIndex >= 0) {
        const updatedCourts = [...updatedTournament.courts];
        updatedCourts[courtIndex] = {
          ...updatedCourts[courtIndex],
          status: "AVAILABLE",
          currentMatch: undefined
        };
        
        updatedTournament = {
          ...updatedTournament,
          courts: updatedCourts
        };
      }
    }
    
    const updatedMatches = updatedTournament.matches.map(m => 
      m.id === matchId ? updatedMatch : m
    );
    
    updatedTournament = {
      ...updatedTournament,
      matches: updatedMatches,
      updatedAt: new Date()
    };
    
    // Update bracket progression with the winner
    updatedTournament = updateBracketProgression(updatedTournament, updatedMatch, winner);
    
    await tournamentService.updateTournament(updatedTournament);
    return updatedTournament;
  }

  // Get matches by status
  async getMatchesByStatus(tournamentId: string, status: MatchStatus): Promise<Match[]> {
    const tournament = await tournamentService.getCurrentTournament();
    if (!tournament || tournament.id !== tournamentId) return [];
    
    return tournament.matches.filter(match => match.status === status);
  }
}

// Create a singleton instance
export const matchService = new MatchService();
