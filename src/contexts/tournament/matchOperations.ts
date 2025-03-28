
import { Tournament, Match, MatchStatus, CourtStatus } from "@/types/tournament";
import { findMatchById, findCourtByNumber, updateMatchInTournament } from "@/utils/tournamentUtils";
import { determineMatchWinnerAndLoser, updateBracketProgression, getDefaultScoringSettings } from "@/utils/matchUtils";

// Update match score
export const updateMatchScoreInTournament = (
  matchId: string, 
  setIndex: number, 
  team1Score: number, 
  team2Score: number,
  currentTournament: Tournament
): Tournament => {
  console.log(`Updating match ${matchId} score at set ${setIndex}: ${team1Score}-${team2Score}`);
  
  const match = findMatchById(currentTournament, matchId);
  if (!match) {
    console.error("Match not found:", matchId);
    return currentTournament;
  }
  
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
  
  console.log("Updated match scores:", updatedScores);
  
  return updateMatchInTournament(currentTournament, updatedMatch);
};

// Update match status
export const updateMatchStatusInTournament = (
  matchId: string, 
  status: MatchStatus, 
  currentTournament: Tournament
): Tournament => {
  const match = findMatchById(currentTournament, matchId);
  if (!match) return currentTournament;
  
  const updatedMatch = {
    ...match,
    status
  };
  
  // If the match is completed or cancelled, free up the court
  if ((status === "COMPLETED" || status === "CANCELLED") && match.courtNumber) {
    const courtToUpdate = findCourtByNumber(currentTournament, match.courtNumber);
    
    if (courtToUpdate) {
      const updatedCourt = {
        ...courtToUpdate,
        status: "AVAILABLE" as CourtStatus,
        currentMatch: undefined
      };
      
      const updatedCourts = currentTournament.courts.map(c => 
        c.id === courtToUpdate.id ? updatedCourt : c
      );
      
      const updatedMatches = currentTournament.matches.map(m => 
        m.id === matchId ? updatedMatch : m
      );
      
      return {
        ...currentTournament,
        matches: updatedMatches,
        courts: updatedCourts,
        updatedAt: new Date()
      };
    }
  }
  
  // If no court update needed, just update the match
  const updatedMatches = currentTournament.matches.map(m => 
    m.id === matchId ? updatedMatch : m
  );
  
  return {
    ...currentTournament,
    matches: updatedMatches,
    updatedAt: new Date()
  };
};

// Complete a match and auto-assign court to next match
export const completeMatchInTournament = (
  matchId: string, 
  currentTournament: Tournament
): Tournament => {
  const match = findMatchById(currentTournament, matchId);
  if (!match) return currentTournament;
  
  // Get scoring settings from tournament or use defaults
  const scoringSettings = currentTournament.scoringSettings || getDefaultScoringSettings();
  
  // Determine winner based on scores
  const result = determineMatchWinnerAndLoser(match, scoringSettings);
  if (!result) {
    console.error("Unable to determine winner and loser for match:", matchId);
    return currentTournament;
  }
  
  const { winner, loser } = result;
  
  console.log(`Match ${matchId} completed. Winner: ${winner.name}, Loser: ${loser.name}`);
  
  const updatedMatch = {
    ...match,
    status: "COMPLETED" as MatchStatus,
    winner,
    loser
  };
  
  // Free up the court
  let updatedTournament = { ...currentTournament };
  let freedCourtId = null;
  
  if (match.courtNumber) {
    const courtIndex = updatedTournament.courts.findIndex(c => c.number === match.courtNumber);
    if (courtIndex >= 0) {
      freedCourtId = updatedTournament.courts[courtIndex].id;
      updatedTournament.courts[courtIndex] = {
        ...updatedTournament.courts[courtIndex],
        status: "AVAILABLE" as CourtStatus,
        currentMatch: undefined
      };
    }
  }
  
  const updatedMatches = updatedTournament.matches.map(m => 
    m.id === matchId ? updatedMatch : m
  );
  
  // Update the tournament with the completed match first
  updatedTournament = {
    ...updatedTournament,
    matches: updatedMatches,
    updatedAt: new Date()
  };
  
  // Now update bracket progression with the winner
  updatedTournament = updateBracketProgression(updatedTournament, updatedMatch, winner);
  
  console.log("Tournament updated with match completion and bracket progression");
  
  // Auto-assign freed court to next scheduled match if enabled
  if (updatedTournament.autoAssignCourts && freedCourtId) {
    const nextScheduledMatch = updatedTournament.matches.find(
      m => m.status === "SCHEDULED" && !m.courtNumber
    );
    
    if (nextScheduledMatch) {
      const match = findMatchById(updatedTournament, nextScheduledMatch.id);
      const court = updatedTournament.courts.find(c => c.id === freedCourtId);
      
      if (match && court) {
        // Update the match with court number
        const matchWithCourt = {
          ...match,
          courtNumber: court.number
        };
        
        // Update the court status and current match
        const updatedCourt = {
          ...court,
          status: "IN_USE" as CourtStatus,
          currentMatch: matchWithCourt
        };
        
        // Update both in the tournament
        const updatedMatchesWithAssignment = updatedTournament.matches.map(m => 
          m.id === matchWithCourt.id ? matchWithCourt : m
        );
        
        const updatedCourtsWithAssignment = updatedTournament.courts.map(c => 
          c.id === updatedCourt.id ? updatedCourt : c
        );
        
        updatedTournament = {
          ...updatedTournament,
          matches: updatedMatchesWithAssignment,
          courts: updatedCourtsWithAssignment
        };
      }
    }
  }
  
  return updatedTournament;
};
