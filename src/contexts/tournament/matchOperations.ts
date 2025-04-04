import { Tournament, Match, MatchStatus, CourtStatus } from "@/types/tournament";
import { findMatchById, findCourtByNumber, updateMatchInTournament } from "@/utils/tournamentUtils";
import { determineMatchWinnerAndLoser, updateBracketProgression, getDefaultScoringSettings } from "@/utils/matchUtils";
import { addScoringAuditInfo, addMatchAuditLog } from "@/utils/matchAuditUtils";
import { getCurrentUserId } from "@/utils/auditUtils";

// Update match score
export const updateMatchScoreInTournament = (
  matchId: string, 
  setIndex: number, 
  team1Score: number, 
  team2Score: number,
  currentTournament: Tournament,
  scorerName?: string // New parameter for scorer name
): Tournament => {
  console.log(`[DEBUG] Updating match ${matchId} score at set ${setIndex}: ${team1Score}-${team2Score}`);
  
  const match = findMatchById(currentTournament, matchId);
  if (!match) {
    console.error(`[ERROR] Match not found: ${matchId}. Cannot update score.`);
    return currentTournament;
  }
  
  const updatedScores = [...match.scores];
  
  // Ensure we have enough sets
  while (updatedScores.length <= setIndex) {
    updatedScores.push({ team1Score: 0, team2Score: 0 });
  }
  
  // Update the score at the specified index
  updatedScores[setIndex] = { team1Score, team2Score };
  
  console.log(`[DEBUG] Updated match scores for ${match.team1.name} vs ${match.team2.name}:`, 
              updatedScores.map(s => `${s.team1Score}-${s.team2Score}`).join(', '));
  
  // Add audit information to the match
  const userId = getCurrentUserId();
  const updatedMatch = addScoringAuditInfo({
    ...match,
    scores: updatedScores,
    scorerName: scorerName || userId // Use provided scorer name or default to user ID
  }, scorerName || userId, match.courtNumber);
  
  return updateMatchInTournament(currentTournament, updatedMatch);
};

// Update match status
export const updateMatchStatusInTournament = (
  matchId: string, 
  status: MatchStatus, 
  currentTournament: Tournament
): Tournament => {
  console.log(`[DEBUG] Updating match ${matchId} status to: ${status}`);
  
  const match = findMatchById(currentTournament, matchId);
  if (!match) {
    console.error(`[ERROR] Match not found: ${matchId}. Cannot update status.`);
    return currentTournament;
  }
  
  const updatedMatch = {
    ...match,
    status
  };
  
  console.log(`[DEBUG] Changing match status for ${match.team1.name} vs ${match.team2.name} from ${match.status} to ${status}`);
  
  // If the match is completed or cancelled, free up the court
  if ((status === "COMPLETED" || status === "CANCELLED") && match.courtNumber) {
    console.log(`[DEBUG] Match ${matchId} is ${status}, freeing up court #${match.courtNumber}`);
    const courtToUpdate = findCourtByNumber(currentTournament, match.courtNumber);
    
    if (courtToUpdate) {
      console.log(`[DEBUG] Found court to update: ${courtToUpdate.id} (Court #${courtToUpdate.number})`);
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
      
      console.log(`[DEBUG] Updated court status to AVAILABLE. Updated match status to ${status}`);
      
      return {
        ...currentTournament,
        matches: updatedMatches,
        courts: updatedCourts,
        updatedAt: new Date()
      };
    } else {
      console.warn(`[WARN] Court #${match.courtNumber} not found to free up for match ${matchId}`);
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
  currentTournament: Tournament,
  scorerName?: string // New parameter for scorer name
): Tournament => {
  console.log(`[DEBUG] Completing match ${matchId}`);
  
  const match = findMatchById(currentTournament, matchId);
  if (!match) {
    console.error(`[ERROR] Match not found: ${matchId}. Cannot complete match.`);
    return currentTournament;
  }
  
  // Get scoring settings from tournament or use defaults
  const scoringSettings = currentTournament.scoringSettings || getDefaultScoringSettings();
  console.log(`[DEBUG] Using scoring settings:`, scoringSettings);
  
  // Determine winner based on scores
  const result = determineMatchWinnerAndLoser(match, scoringSettings);
  if (!result) {
    console.error(`[ERROR] Unable to determine winner and loser for match: ${matchId}`);
    console.log(`[DEBUG] Match scores:`, match.scores);
    return currentTournament;
  }
  
  const { winner, loser } = result;
  const userId = getCurrentUserId();
  const now = new Date();
  
  console.log(`[DEBUG] Match ${matchId} completed. Winner: ${winner.name}, Loser: ${loser.name}`);
  console.log(`[DEBUG] Final scores:`, match.scores.map(s => `${s.team1Score}-${s.team2Score}`).join(', '));
  
  // Create updated match with completion details and audit information
  const updatedMatch = addScoringAuditInfo({
    ...match,
    status: "COMPLETED" as MatchStatus,
    winner,
    loser,
    endTime: now,
    scorerName: scorerName || userId, // Use provided scorer name or default to user ID
  }, scorerName || userId, match.courtNumber);
  
  // Free up the court
  let updatedTournament = { ...currentTournament };
  let freedCourtId = null;
  
  if (match.courtNumber) {
    console.log(`[DEBUG] Freeing up court #${match.courtNumber} after match completion`);
    const courtIndex = updatedTournament.courts.findIndex(c => c.number === match.courtNumber);
    if (courtIndex >= 0) {
      freedCourtId = updatedTournament.courts[courtIndex].id;
      updatedTournament.courts[courtIndex] = {
        ...updatedTournament.courts[courtIndex],
        status: "AVAILABLE" as CourtStatus,
        currentMatch: undefined
      };
      console.log(`[DEBUG] Court #${match.courtNumber} (ID: ${freedCourtId}) now available`);
    } else {
      console.warn(`[WARN] Court #${match.courtNumber} not found in tournament courts`);
    }
  }
  
  const updatedMatches = updatedTournament.matches.map(m => 
    m.id === matchId ? updatedMatch : m
  );
  
  // Update the tournament with the completed match first
  updatedTournament = {
    ...updatedTournament,
    matches: updatedMatches,
    updatedAt: now
  };
  
  // Now update bracket progression with the winner
  console.log(`[DEBUG] Updating bracket progression with winner ${winner.name}`);
  updatedTournament = updateBracketProgression(updatedTournament, updatedMatch, winner);
  
  console.log(`[DEBUG] Tournament updated with match completion and bracket progression`);
  
  // Auto-assign freed court to next scheduled match if enabled
  if (updatedTournament.autoAssignCourts && freedCourtId) {
    console.log(`[DEBUG] Auto-assign courts is enabled. Looking for next scheduled match to use court #${match.courtNumber}`);
    const nextScheduledMatch = updatedTournament.matches.find(
      m => m.status === "SCHEDULED" && !m.courtNumber
    );
    
    if (nextScheduledMatch) {
      console.log(`[DEBUG] Found next scheduled match: ${nextScheduledMatch.id} (${nextScheduledMatch.team1.name} vs ${nextScheduledMatch.team2.name})`);
      const nextMatch = findMatchById(updatedTournament, nextScheduledMatch.id);
      const court = updatedTournament.courts.find(c => c.id === freedCourtId);
      
      if (nextMatch && court) {
        console.log(`[DEBUG] Assigning court #${court.number} to next match ${nextMatch.id}`);
        // Update the match with court number
        const matchWithCourt = {
          ...nextMatch,
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
        
        console.log(`[DEBUG] Court #${court.number} assigned to match ${nextMatch.id}`);
      }
    } else {
      console.log(`[DEBUG] No scheduled matches without a court found. Court remains available.`);
    }
  }
  
  return updatedTournament;
};
