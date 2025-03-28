
import { Match, Team, TournamentStage, Division, MatchStatus, ScoringSettings, Tournament } from "@/types/tournament";
import { generateId, findMatchById } from "./tournamentUtils";

// Get default scoring settings for a tournament
export const getDefaultScoringSettings = (): ScoringSettings => {
  return {
    maxPoints: 21,
    maxSets: 3,
    requireTwoPointLead: true,
    maxTwoPointLeadScore: 30, // Added default max score for two-point lead rule
  };
};

// Create a new match
export const createMatch = (
  tournamentId: string,
  team1: Team,
  team2: Team,
  division: Division,
  stage: TournamentStage,
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
    courtNumber,
    scheduledTime,
    status: "SCHEDULED",
    bracketRound: 1
  };
};

// Check if a set is complete based on scoring settings
export const isSetComplete = (
  team1Score: number, 
  team2Score: number, 
  settings: ScoringSettings
): boolean => {
  // If either team has reached or exceeded the maximum points
  if (team1Score >= settings.maxPoints || team2Score >= settings.maxPoints) {
    // If a two-point lead is required
    if (settings.requireTwoPointLead) {
      const pointDifference = Math.abs(team1Score - team2Score);
      
      // Check if the two-point lead has been achieved
      if (pointDifference >= 2) {
        return true;
      }
      
      // Check if we've hit the maximum score cap (if defined)
      if (settings.maxTwoPointLeadScore) {
        if (team1Score >= settings.maxTwoPointLeadScore || 
            team2Score >= settings.maxTwoPointLeadScore) {
          // At max cap, whoever is ahead wins
          return true;
        }
      }
      
      return false;
    }
    
    // No two-point lead required, just check if either team has reached the max points
    return true;
  }
  
  return false;
};

// Count sets won by each team
export const countSetsWon = (match: Match): { team1Sets: number; team2Sets: number } => {
  let team1Sets = 0;
  let team2Sets = 0;

  match.scores.forEach(score => {
    if (score.team1Score > score.team2Score) {
      team1Sets++;
    } else if (score.team2Score > score.team1Score) {
      team2Sets++;
    }
  });

  return { team1Sets, team2Sets };
};

// Determine the winner and loser of a match
export const determineMatchWinnerAndLoser = (
  match: Match, 
  settings: ScoringSettings
): { winner: Team; loser: Team } | null => {
  const { team1Sets, team2Sets } = countSetsWon(match);
  const setsToWin = Math.ceil(settings.maxSets / 2);

  if (team1Sets >= setsToWin) {
    return { winner: match.team1, loser: match.team2 };
  } else if (team2Sets >= setsToWin) {
    return { winner: match.team2, loser: match.team1 };
  }

  // Not enough sets have been won yet
  return null;
};

// Update bracket progression after a match is completed
export const updateBracketProgression = (
  tournament: Tournament, 
  completedMatch: Match, 
  winner: Team
): Tournament => {
  if (!completedMatch.nextMatchId) {
    // Look for the next round match based on bracketRound and bracketPosition
    if (completedMatch.bracketRound && completedMatch.bracketPosition) {
      const nextRound = completedMatch.bracketRound + 1;
      const nextPosition = Math.ceil(completedMatch.bracketPosition / 2);
      
      const nextMatch = tournament.matches.find(m => 
        m.bracketRound === nextRound && 
        m.bracketPosition === nextPosition &&
        m.division === completedMatch.division
      );
      
      if (nextMatch) {
        // Update the winner's completed match to point to the next match
        const updatedCompletedMatch = {
          ...completedMatch,
          nextMatchId: nextMatch.id
        };
        
        // Determine whether the winner goes to team1 or team2 slot in the next match
        let updatedNextMatch: Match;
        
        // If the completed match's bracketPosition is odd, winner goes to team1, otherwise team2
        if (completedMatch.bracketPosition % 2 === 1) {
          updatedNextMatch = {
            ...nextMatch,
            team1: winner
          };
        } else {
          updatedNextMatch = {
            ...nextMatch,
            team2: winner
          };
        }
        
        // Update both matches in the tournament
        const updatedMatches = tournament.matches.map(m => {
          if (m.id === completedMatch.id) return updatedCompletedMatch;
          if (m.id === nextMatch.id) return updatedNextMatch;
          return m;
        });
        
        return {
          ...tournament,
          matches: updatedMatches,
          updatedAt: new Date()
        };
      }
    }
    
    return tournament;
  }

  const nextMatch = findMatchById(tournament, completedMatch.nextMatchId);
  if (!nextMatch) return tournament;

  // Determine whether the winner goes to team1 or team2 slot in the next match
  let updatedNextMatch: Match;

  // Simple logic: If the completed match is in an odd bracket position,
  // the winner goes to team1, otherwise team2
  if (completedMatch.bracketPosition && completedMatch.bracketPosition % 2 === 1) {
    updatedNextMatch = {
      ...nextMatch,
      team1: winner
    };
  } else {
    updatedNextMatch = {
      ...nextMatch,
      team2: winner
    };
  }

  // Update the match in the tournament
  const updatedMatches = tournament.matches.map(m => 
    m.id === nextMatch.id ? updatedNextMatch : m
  );

  return {
    ...tournament,
    matches: updatedMatches,
    updatedAt: new Date()
  };
};

// Update a match's status
export const updateMatchStatus = (match: Match, status: MatchStatus): Match => {
  return {
    ...match,
    status
  };
};

// Add a score to a match
export const addScoreToMatch = (match: Match, team1Score: number, team2Score: number): Match => {
  const updatedScores = [...match.scores, { team1Score, team2Score }];
  
  return {
    ...match,
    scores: updatedScores
  };
};

// Get the current set number for a match
export const getCurrentSetNumber = (match: Match): number => {
  return match.scores.length + 1;
};

// Check if a match is complete based on sets won
export const isMatchComplete = (match: Match, settings: ScoringSettings): boolean => {
  const { team1Sets, team2Sets } = countSetsWon(match);
  const setsToWin = Math.ceil(settings.maxSets / 2);
  
  return team1Sets >= setsToWin || team2Sets >= setsToWin;
};
