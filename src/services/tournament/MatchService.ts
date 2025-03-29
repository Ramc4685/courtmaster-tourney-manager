
import { Tournament, Match, MatchStatus, MatchScore, CourtStatus } from "@/types/tournament";
import { tournamentService } from "./TournamentService";
import { findMatchById, findCourtByNumber } from "@/utils/tournamentUtils";
import { determineMatchWinnerAndLoser, updateBracketProgression, getDefaultScoringSettings } from "@/utils/matchUtils";
import { freeCourt } from "@/utils/courtUtils";

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
      scores: updatedScores,
      updatedAt: new Date() // Add timestamp for real-time updates
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
    
    // Publish update for real-time functionality
    await this.publishMatchUpdate(updatedMatch);
    
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
      status,
      updatedAt: new Date() // Add timestamp for real-time updates
    };
    
    // If the match is completed or cancelled, free up the court
    if ((status === "COMPLETED" || status === "CANCELLED") && match.courtNumber) {
      let updatedTournament = freeCourt(tournament, match.courtNumber);
      
      // Remove court assignment from the match
      const matchWithoutCourt = {
        ...updatedMatch,
        courtNumber: undefined
      };
      
      const updatedMatches = updatedTournament.matches.map(m => 
        m.id === matchId ? matchWithoutCourt : m
      );
      
      updatedTournament = {
        ...updatedTournament,
        matches: updatedMatches,
        updatedAt: new Date()
      };
      
      await tournamentService.updateTournament(updatedTournament);
      
      // Publish update for real-time functionality
      await this.publishMatchUpdate(matchWithoutCourt);
      
      return updatedTournament;
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
    
    // Publish update for real-time functionality
    await this.publishMatchUpdate(updatedMatch);
    
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
    
    // Get scoring settings with badminton defaults
    const scoringSettings = tournament.scoringSettings || getDefaultScoringSettings();
    
    // Determine winner based on scores
    const result = determineMatchWinnerAndLoser(match, scoringSettings);
    if (!result) return null;
    
    const { winner, loser } = result;
    
    const updatedMatch = {
      ...match,
      status: "COMPLETED" as MatchStatus,
      winner,
      loser,
      updatedAt: new Date() // Add timestamp for real-time updates
    };
    
    // Update the match in the tournament
    let updatedTournament = { ...tournament };
    
    // Free up the court if assigned and remove court assignment from match
    if (match.courtNumber) {
      updatedTournament = freeCourt(updatedTournament, match.courtNumber);
      updatedMatch.courtNumber = undefined; // Clear court assignment
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
    
    // Publish update for real-time functionality
    await this.publishMatchUpdate(updatedMatch);
    
    return updatedTournament;
  }

  // Get matches by status
  async getMatchesByStatus(tournamentId: string, status: MatchStatus): Promise<Match[]> {
    const tournament = await tournamentService.getCurrentTournament();
    if (!tournament || tournament.id !== tournamentId) return [];
    
    return tournament.matches.filter(match => match.status === status);
  }
  
  // Publish match update for real-time functionality
  private async publishMatchUpdate(match: Match): Promise<void> {
    try {
      // This would use a real-time service in a production environment
      // Here we're just logging to help with debugging
      console.log(`[DEBUG] Publishing match update: Match ID=${match.id}, Status=${match.status}`);
      // In a real implementation, this would publish to a real-time database or message broker
    } catch (error) {
      console.error('[ERROR] Failed to publish match update:', error);
    }
  }
}

// Create a singleton instance
export const matchService = new MatchService();
