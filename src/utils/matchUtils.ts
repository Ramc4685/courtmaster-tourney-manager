
import { Match, ScoringSettings, MatchScore, Team, Tournament } from "@/types/tournament";

export const getDefaultScoringSettings = (): ScoringSettings => ({
  pointsToWin: 21,
  mustWinByTwo: true,
  maxPoints: 30,
  maxSets: 3,
  requireTwoPointLead: true,
  maxTwoPointLeadScore: 30,
  setsToWin: 2, // Default to best of 3 (need to win 2 sets)
});

export const validateScore = (
  team1Score: number,
  team2Score: number,
  scoringSettings: ScoringSettings
): { valid: boolean; message: string } => {
  const { pointsToWin, mustWinByTwo, maxPoints } = scoringSettings;

  if (team1Score < 0 || team2Score < 0) {
    return { valid: false, message: "Scores cannot be negative." };
  }

  if (team1Score > maxPoints || team2Score > maxPoints) {
    return {
      valid: false,
      message: `Scores cannot exceed the maximum of ${maxPoints}.`,
    };
  }

  const scoreDifference = Math.abs(team1Score - team2Score);

  if (
    team1Score >= pointsToWin ||
    team2Score >= pointsToWin
  ) {
    if (mustWinByTwo && scoreDifference < 2) {
      return {
        valid: false,
        message: "Must win by two points.",
      };
    }
  }

  return { valid: true, message: "" };
};

export const isSetComplete = (
  team1Score: number,
  team2Score: number,
  scoringSettings: ScoringSettings
): boolean => {
  const { pointsToWin, mustWinByTwo, maxPoints } = scoringSettings;

  const scoreCap = maxPoints || 30;

  if (team1Score >= scoreCap || team2Score >= scoreCap) {
    if (mustWinByTwo) {
      return Math.abs(team1Score - team2Score) >= 2;
    }
    return true;
  }

  if (team1Score >= pointsToWin || team2Score >= pointsToWin) {
    if (mustWinByTwo) {
      return Math.abs(team1Score - team2Score) >= 2;
    }
    return true;
  }

  return false;
};

// New function to check if a match is complete
export const isMatchComplete = (match: Match, scoringSettings: ScoringSettings): boolean => {
  if (!match.scores || match.scores.length === 0) {
    return false;
  }
  
  const team1Sets = countSetsWon(match.scores, "team1");
  const team2Sets = countSetsWon(match.scores, "team2");
  
  const setsToWin = scoringSettings.setsToWin || Math.ceil(scoringSettings.maxSets / 2);
  
  return team1Sets >= setsToWin || team2Sets >= setsToWin;
};

export function generateMatchNumber(tournament: Tournament): string {
  const nextMatchNumber = tournament.matches.length + 1;
  const paddedMatchNumber = String(nextMatchNumber).padStart(3, '0');
  return `M-${paddedMatchNumber}`;
}

// Function to determine match winner and loser
export function determineMatchWinnerAndLoser(match: Match, scoringSettings: ScoringSettings) {
  if (!match.scores || match.scores.length === 0) {
    return null;
  }

  const team1Sets = countSetsWon(match.scores, "team1");
  const team2Sets = countSetsWon(match.scores, "team2");
  
  const setsToWin = scoringSettings.setsToWin || Math.ceil(scoringSettings.maxSets / 2);
  
  if (team1Sets >= setsToWin) {
    return {
      winner: match.team1,
      loser: match.team2,
      winnerId: match.team1?.id
    };
  } else if (team2Sets >= setsToWin) {
    return {
      winner: match.team2,
      loser: match.team1, 
      winnerId: match.team2?.id
    };
  }
  
  return null;
}

// Function to count sets won by a team
export function countSetsWon(scores: MatchScore[], team: "team1" | "team2"): number {
  if (!scores || !scores.length) return 0;
  
  return scores.filter(score => {
    const oppositeTeam = team === "team1" ? "team2" : "team1";
    const teamScore = score[`${team}Score`];
    const oppositeScore = score[`${oppositeTeam}Score`];
    
    return teamScore > oppositeScore;
  }).length;
}

// Function to update bracket progression
export function updateBracketProgression(tournament: Tournament, match: Match, winner?: Team): Tournament {
  if (!match.nextMatchId || match.status !== "COMPLETED" || !match.winner) {
    return tournament;
  }
  
  const nextMatch = tournament.matches.find(m => m.id === match.nextMatchId);
  if (!nextMatch) return tournament;
  
  // Determine if this match feeds into team1 or team2 spot of next match
  // This is typically determined by bracket position
  const isLowerBracket = match.bracketPosition % 2 === 0;
  
  const updatedNextMatch = {
    ...nextMatch,
    [isLowerBracket ? 'team2' : 'team1']: match.winner || winner,
    [isLowerBracket ? 'team2Id' : 'team1Id']: (match.winner || winner)?.id
  };
  
  const updatedMatches = tournament.matches.map(m => 
    m.id === nextMatch.id ? updatedNextMatch : m
  );
  
  return {
    ...tournament,
    matches: updatedMatches
  };
}

// Adding utility functions for tournament format support
export const isBadmintonSingles = (categoryType: string): boolean => {
  return categoryType === "MENS_SINGLES" || categoryType === "WOMENS_SINGLES";
};

export const isBadmintonDoubles = (categoryType: string): boolean => {
  return categoryType === "MENS_DOUBLES" || categoryType === "WOMENS_DOUBLES" || categoryType === "MIXED_DOUBLES";
};
