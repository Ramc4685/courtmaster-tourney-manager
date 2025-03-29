import { Match, ScoringSettings, Team, Tournament } from "@/types/tournament";
import { generateId } from "./tournamentUtils";

// Get default scoring settings (updated for badminton)
export const getDefaultScoringSettings = (): ScoringSettings => {
  return {
    maxPoints: 21, // Standard badminton scoring to 21 points
    maxSets: 3,    // Best of 3 sets in badminton
    requireTwoPointLead: true, // Badminton requires 2-point lead to win
    maxTwoPointLeadScore: 30   // Maximum score with two-point lead rule (can go beyond 21)
  };
};

// Determine if a set is complete
export const isSetComplete = (
  team1Score: number,
  team2Score: number,
  settings: ScoringSettings
): boolean => {
  const { maxPoints, requireTwoPointLead, maxTwoPointLeadScore } = settings;
  
  // Regular win condition: reached max points
  if (team1Score >= maxPoints || team2Score >= maxPoints) {
    // If 2-point lead is required
    if (requireTwoPointLead) {
      const scoreDifference = Math.abs(team1Score - team2Score);
      
      // Win by 2 points
      if (scoreDifference >= 2) {
        return true;
      }
      
      // Or reached the maximum extended score with at least 1 point lead
      if ((team1Score >= maxTwoPointLeadScore || team2Score >= maxTwoPointLeadScore) && scoreDifference >= 1) {
        return true;
      }
      
      // Still playing to get a 2-point lead
      return false;
    }
    
    // No 2-point lead required, reaching max points is enough
    return true;
  }
  
  return false;
};

// Determine if a match is complete
export const isMatchComplete = (match: Match, settings: ScoringSettings): boolean => {
  const { maxSets } = settings;
  
  // Count sets won by each team
  let team1Sets = 0;
  let team2Sets = 0;
  
  match.scores.forEach(score => {
    if (isSetComplete(score.team1Score, score.team2Score, settings)) {
      if (score.team1Score > score.team2Score) {
        team1Sets++;
      } else {
        team2Sets++;
      }
    }
  });
  
  // In best-of-N format, a player needs to win (maxSets/2)+1 sets
  const setsNeededToWin = Math.ceil(maxSets / 2);
  
  return team1Sets >= setsNeededToWin || team2Sets >= setsNeededToWin;
};

// Determine winner and loser of a match
export const determineMatchWinnerAndLoser = (
  match: Match, 
  settings: ScoringSettings
): { winner: Team, loser: Team } | null => {
  // Count sets won by each team
  let team1Sets = 0;
  let team2Sets = 0;
  
  match.scores.forEach(score => {
    if (isSetComplete(score.team1Score, score.team2Score, settings)) {
      if (score.team1Score > score.team2Score) {
        team1Sets++;
      } else {
        team2Sets++;
      }
    }
  });
  
  if (team1Sets > team2Sets) {
    return { winner: match.team1, loser: match.team2 };
  } else if (team2Sets > team1Sets) {
    return { winner: match.team2, loser: match.team1 };
  }
  
  return null; // No winner yet
};

// Update bracket progression
export const updateBracketProgression = (
  tournament: Tournament,
  match: Match,
  winner: Team
): Tournament => {
  // If the match has a next match defined, update that match
  if (match.nextMatchId) {
    const nextMatch = tournament.matches.find(m => m.id === match.nextMatchId);
    
    if (nextMatch) {
      // Determine if this match feeds into team1 or team2 of the next match
      // This logic would depend on your tournament bracket structure
      // For simplicity, we'll assume there's a pattern to determine this
      
      // For example, if match positions are structured in a way that
      // odd-numbered positions feed into team1 and even into team2:
      const updatedNextMatch = { ...nextMatch };
      
      if (match.bracketPosition && match.bracketPosition % 2 === 1) {
        updatedNextMatch.team1 = winner;
      } else {
        updatedNextMatch.team2 = winner;
      }
      
      const updatedMatches = tournament.matches.map(m => 
        m.id === nextMatch.id ? updatedNextMatch : m
      );
      
      return {
        ...tournament,
        matches: updatedMatches
      };
    }
  }
  
  return tournament;
};

// Added function: Count the number of sets won by each team
export const countSetsWon = (match: Match): { team1Sets: number, team2Sets: number } => {
  let team1Sets = 0;
  let team2Sets = 0;
  
  match.scores.forEach(score => {
    if (score.team1Score > score.team2Score) {
      team1Sets++;
    } else if (score.team2Score > score.team1Score) {
      team2Sets++;
    }
    // If scores are equal, no one wins the set
  });
  
  return { team1Sets, team2Sets };
};

// Added function: Create a new match with generated ID
export const createMatch = (
  tournamentId: string,
  team1: Team,
  team2: Team,
  division: string,
  stage: string,
  scheduledTime?: Date,
  courtNumber?: number
): Match => {
  return {
    id: generateId(),
    tournamentId,
    team1,
    team2,
    scores: [],
    division,
    stage,
    scheduledTime,
    status: "SCHEDULED",
    courtNumber,
    updatedAt: new Date()
  };
};
