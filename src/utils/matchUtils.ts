import { Match, ScoringSettings, Tournament, Division, TournamentStage, TournamentCategory } from "@/types/tournament";

// Default scoring settings
export const getDefaultScoringSettings = (): ScoringSettings => {
  return {
    pointsToWin: 21,
    mustWinByTwo: true,
    maxPoints: 30,
    maxSets: 3,
    requireTwoPointLead: true,
    maxTwoPointLeadScore: 30
  };
};

// Check if a set is complete based on scoring rules
export const isSetComplete = (
  team1Score: number,
  team2Score: number,
  scoringSettings: ScoringSettings
): boolean => {
  const { pointsToWin, mustWinByTwo, maxPoints } = scoringSettings;
  
  // Check if any team has reached the minimum points to win
  const reachedMinPoints = team1Score >= pointsToWin || team2Score >= pointsToWin;
  
  // If "must win by two" is enabled, check the point difference
  if (mustWinByTwo && scoringSettings.requireTwoPointLead) {
    const scoreDifference = Math.abs(team1Score - team2Score);
    const reachedMaxPoints = team1Score >= scoringSettings.maxTwoPointLeadScore || team2Score >= scoringSettings.maxTwoPointLeadScore;
    
    // Set is complete if:
    // 1. A team has reached minimum points AND has a 2+ point lead, OR
    // 2. A team has reached the maximum points
    return (reachedMinPoints && scoreDifference >= 2) || reachedMaxPoints;
  } else {
    // If "must win by two" is disabled, only check if minimum points are reached
    return reachedMinPoints;
  }
};

// Check if a match is complete based on sets won
export const isMatchComplete = (
  match: Match,
  scoringSettings: ScoringSettings
): boolean => {
  // Count sets won by each team
  const setsWon = {
    team1: 0,
    team2: 0
  };
  
  // Count how many sets each team has won
  match.scores?.forEach(score => {
    if (isSetComplete(score.team1Score, score.team2Score, scoringSettings)) {
      if (score.team1Score > score.team2Score) {
        setsWon.team1++;
      } else if (score.team2Score > score.team1Score) {
        setsWon.team2++;
      }
    }
  });
  
  // Match is complete if either team has won majority of sets
  // For example, in a best-of-3 format, a team needs to win 2 sets
  const setsNeededToWin = Math.ceil(scoringSettings.maxSets / 2);
  return setsWon.team1 >= setsNeededToWin || setsWon.team2 >= setsNeededToWin;
};

// Determine the winner of a match
export const getMatchWinner = (
  match: Match,
  scoringSettings: ScoringSettings
): string | null => {
  // Count sets won by each team
  const setsWon = {
    team1: 0,
    team2: 0
  };
  
  // Count how many sets each team has won
  match.scores?.forEach(score => {
    if (isSetComplete(score.team1Score, score.team2Score, scoringSettings)) {
      if (score.team1Score > score.team2Score) {
        setsWon.team1++;
      } else if (score.team2Score > score.team1Score) {
        setsWon.team2++;
      }
    }
  });
  
  // Determine winner based on sets won
  const setsNeededToWin = Math.ceil(scoringSettings.maxSets / 2);
  if (setsWon.team1 >= setsNeededToWin) {
    return match.team1Id || null;
  } else if (setsWon.team2 >= setsNeededToWin) {
    return match.team2Id || null;
  }
  
  return null; // No winner yet
};

// Get next match in the bracket
export const getNextMatch = (
  currentMatch: Match,
  matches: Match[]
): Match | null => {
  // If the current match has a next match ID, find that match
  if (currentMatch.nextMatchId) {
    return matches.find(m => m.id === currentMatch.nextMatchId) || null;
  }
  
  // Otherwise, try to find the next match based on bracket position
  if (typeof currentMatch.bracketPosition === 'number' && typeof currentMatch.bracketRound === 'number') {
    const nextRound = currentMatch.bracketRound + 1;
    const nextPosition = Math.floor(currentMatch.bracketPosition / 2);
    
    return matches.find(m => 
      m.bracketRound === nextRound && 
      m.bracketPosition === nextPosition
    ) || null;
  }
  
  return null;
};

// Generate match display names
export const getMatchDisplayName = (
  match: Match,
  format: string, 
  round: number
): string => {
  if (format === 'SINGLE_ELIMINATION') {
    const totalRounds = 4; // Example: for a 16-team tournament
    const lastRound = totalRounds;
    
    if (round === lastRound) return 'Final';
    if (round === lastRound - 1) return 'Semi-Final';
    if (round === lastRound - 2) return 'Quarter-Final';
    return `Round ${round}`;
  } else if (format === 'DOUBLE_ELIMINATION') {
    // Handle double elimination naming
    if (match.status === 'COMPLETED') {
      return `${format} Match ${match.id}`;
    }
    return `${format} R${round}`;
  } else {
    // Default match naming
    return `Match ${match.id}`;
  }
};

// Create a new match object
export const createEmptyMatch = (tournamentId: string, matchId: string): Match => {
  return {
    id: matchId,
    tournamentId: tournamentId,
    status: 'SCHEDULED',
    division: 'MENS',
    stage: 'KNOCKOUT',
    scores: [],
    createdAt: new Date(),
    updatedAt: new Date()
  };
};

// Create a sample match for testing
export const createSampleMatch = (): Match => {
  return {
    id: 'sample-match-1',
    tournamentId: 'sample-tournament',
    team1Id: 'team-1',
    team2Id: 'team-2',
    team1: {
      id: 'team-1',
      name: 'Team 1',
      players: [{ id: 'player-1', name: 'Player 1' }]
    },
    team2: {
      id: 'team-2',
      name: 'Team 2',
      players: [{ id: 'player-2', name: 'Player 2' }]
    },
    status: 'SCHEDULED',
    scores: [],
    division: 'MENS',
    stage: 'KNOCKOUT',
    category: {
      id: 'mens-singles',
      name: 'Men\'s Singles',
      type: 'MENS_SINGLES'
    },
    createdAt: new Date(),
    updatedAt: new Date()
  };
};
