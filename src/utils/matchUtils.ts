
import { Match, MatchScore, Team, Tournament, ScoringSettings } from "@/types/tournament";
import { MatchStatus } from "@/types/tournament-enums";

// Check if a set is complete based on scoring rules
export const isSetComplete = (
  team1Score: number,
  team2Score: number,
  pointsToWin: number,
  mustWinByTwo: boolean,
  maxPoints?: number
): boolean => {
  // Check if either team has reached the required points to win
  if (team1Score >= pointsToWin || team2Score >= pointsToWin) {
    // If we must win by two, check the point difference
    if (mustWinByTwo) {
      const scoreDifference = Math.abs(team1Score - team2Score);
      
      // If we have a max points limit and either team has reached it,
      // the set is complete even if they don't have a 2-point lead
      if (maxPoints && (team1Score >= maxPoints || team2Score >= maxPoints)) {
        return true;
      }
      
      // Otherwise, we need a 2-point lead
      return scoreDifference >= 2;
    }
    
    // If we don't need to win by two, then reaching the points to win is enough
    return true;
  }
  
  return false;
};

// Get the winner of a set
export const getSetWinner = (
  set: MatchScore, 
  team1: Team | string, 
  team2: Team | string
): Team | string | null => {
  if (set.team1Score > set.team2Score) {
    return team1;
  } else if (set.team2Score > set.team1Score) {
    return team2;
  }
  return null;
};

// Count the number of sets won by each team
export const countSetsWon = (scores: MatchScore[]): { team1Sets: number; team2Sets: number } => {
  return scores.reduce(
    (acc, set) => {
      if (set.team1Score > set.team2Score) {
        return { ...acc, team1Sets: acc.team1Sets + 1 };
      } else if (set.team2Score > set.team1Score) {
        return { ...acc, team2Sets: acc.team2Sets + 1 };
      }
      return acc;
    },
    { team1Sets: 0, team2Sets: 0 }
  );
};

// Check if a match is complete based on the sets won and scoring settings
export const isMatchComplete = (
  scores: MatchScore[],
  setsToWin: number
): boolean => {
  const { team1Sets, team2Sets } = countSetsWon(scores);
  return team1Sets >= setsToWin || team2Sets >= setsToWin;
};

// Get default scoring settings based on sport type
export const getDefaultScoringSettings = (): ScoringSettings => {
  return {
    pointsToWin: 21,
    mustWinByTwo: true,
    maxPoints: 30,
    setsToWin: 2,
    maxSets: 3,
    requireTwoPointLead: true,
    maxTwoPointLeadScore: 30,
    gamesPerSet: 1,
    pointsPerGame: 21
  };
};

// Determine the winner and loser of a match
export const determineMatchWinnerAndLoser = (
  match: Match,
  scoringSettings: { setsToWin: number }
): { winner: Team | null; loser: Team | null } => {
  const { team1Sets, team2Sets } = countSetsWon(match.scores);
  
  if (team1Sets >= scoringSettings.setsToWin && match.team1) {
    return { winner: match.team1, loser: match.team2 || null };
  } else if (team2Sets >= scoringSettings.setsToWin && match.team2) {
    return { winner: match.team2, loser: match.team1 || null };
  }
  
  return { winner: null, loser: null };
};

// Update bracket progression after a match is completed
export const updateBracketProgression = (tournament: Tournament, match: Match): Tournament => {
  const updatedTournament = { ...tournament };
  const { matches } = updatedTournament;

  // Only process if match is completed and has a winner
  if (match.status !== MatchStatus.COMPLETED || !match.winner) {
    return updatedTournament;
  }

  console.log(`[updateBracketProgression] Processing match ${match.id}, winner: ${match.winner?.name || match.winner?.id}`);

  // Method 1: Handle progression.nextMatchId pattern (used by SingleEliminationFormat)
  if (match.progression?.nextMatchId) {
    const nextMatch = matches.find(m => m.id === match.progression?.nextMatchId);
    if (nextMatch) {
      const updatedMatch = { ...nextMatch };

      // Place winner in the correct position
      if (match.progression.nextMatchPosition === 'team1') {
        updatedMatch.team1 = match.winner;
        if (match.winner.id) {
          updatedMatch.team1Id = match.winner.id;
        }
      } else {
        updatedMatch.team2 = match.winner;
        if (match.winner.id) {
          updatedMatch.team2Id = match.winner.id;
        }
      }

      // Update the match in the tournament
      const matchIndex = matches.findIndex(m => m.id === nextMatch.id);
      if (matchIndex !== -1) {
        matches[matchIndex] = updatedMatch;
        console.log(`[updateBracketProgression] Advanced winner to match ${nextMatch.id} as ${match.progression.nextMatchPosition}`);
      }
    }
  }

  // Method 2: Handle bracketRound/bracketPosition pattern (alternative approach)
  if (match.bracketRound && match.bracketPosition) {
    // Find the next round match based on bracket position
    const nextRound = match.bracketRound + 1;
    const nextPosition = Math.ceil(match.bracketPosition / 2);

    const nextMatch = matches.find(m =>
      m.bracketRound === nextRound &&
      m.bracketPosition === nextPosition &&
      m.categoryId === match.categoryId
    );

    if (nextMatch && !match.progression?.nextMatchId) {
      const updatedMatch = { ...nextMatch };

      // Odd positions go to team1, even positions go to team2
      const isOddPosition = match.bracketPosition % 2 === 1;

      if (isOddPosition) {
        updatedMatch.team1 = match.winner;
        if (match.winner.id) {
          updatedMatch.team1Id = match.winner.id;
        }
      } else {
        updatedMatch.team2 = match.winner;
        if (match.winner.id) {
          updatedMatch.team2Id = match.winner.id;
        }
      }

      // Update the match in the tournament
      const matchIndex = matches.findIndex(m => m.id === nextMatch.id);
      if (matchIndex !== -1) {
        matches[matchIndex] = updatedMatch;
        console.log(`[updateBracketProgression] Advanced winner to round ${nextRound}, position ${nextPosition}`);
      }
    }
  }

  // Method 3: Handle string-based bracketPosition pattern (legacy approach)
  if (typeof match.bracketPosition === 'string') {
    const nextMatches = matches.filter(m =>
      typeof m.bracketPosition === 'string' && (
        m.bracketPosition.includes(`W${match.bracketPosition}`) ||
        m.bracketPosition.includes(`L${match.bracketPosition}`)
      )
    );

    nextMatches.forEach(nextMatch => {
      const updatedMatch = { ...nextMatch };

      if (typeof updatedMatch.bracketPosition === 'string') {
        if (updatedMatch.bracketPosition.includes(`W${match.bracketPosition}`)) {
          // Winner advances
          if (updatedMatch.bracketPosition.startsWith('W')) {
            updatedMatch.team1 = match.winner;
            if (match.winner.id) {
              updatedMatch.team1Id = match.winner.id;
            }
          } else {
            updatedMatch.team2 = match.winner;
            if (match.winner.id) {
              updatedMatch.team2Id = match.winner.id;
            }
          }
        } else if (updatedMatch.bracketPosition.includes(`L${match.bracketPosition}`)) {
          // Loser advances to loser's bracket (double elimination)
          if (match.loser) {
            if (updatedMatch.bracketPosition.startsWith('W')) {
              updatedMatch.team1 = match.loser;
              if (match.loser.id) {
                updatedMatch.team1Id = match.loser.id;
              }
            } else {
              updatedMatch.team2 = match.loser;
              if (match.loser.id) {
                updatedMatch.team2Id = match.loser.id;
              }
            }
          }
        }
      }

      // Update the match in the tournament
      const matchIndex = matches.findIndex(m => m.id === nextMatch.id);
      if (matchIndex !== -1) {
        matches[matchIndex] = updatedMatch;
      }
    });
  }

  return updatedTournament;
};
