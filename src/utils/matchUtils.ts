
import { Match, Team, Tournament, Division, TournamentStage, MatchStatus, ScoringSettings } from "@/types/tournament";
import { generateId } from "./tournamentUtils";

// Create a new match
export const createMatch = (
  tournamentId: string, 
  team1: Team, 
  team2: Team, 
  division: Division,
  stage: TournamentStage,
  scheduledTime?: Date,
  courtNumber?: number,
  bracketRound?: number,
  bracketPosition?: number,
  groupName?: string
): Match => {
  return {
    id: generateId(),
    tournamentId,
    team1,
    team2,
    scores: [{ team1Score: 0, team2Score: 0 }],
    division,
    stage,
    courtNumber,
    scheduledTime,
    status: "SCHEDULED" as MatchStatus,
    bracketRound,
    bracketPosition,
    groupName
  };
};

// Get default scoring settings for badminton
export const getDefaultScoringSettings = (): ScoringSettings => {
  return {
    maxPoints: 21,
    maxSets: 3,
    requireTwoPointLead: true
  };
};

// Check if a set is complete based on badminton rules
export const isSetComplete = (
  team1Score: number, 
  team2Score: number, 
  scoringSettings: ScoringSettings
): boolean => {
  const { maxPoints, requireTwoPointLead } = scoringSettings;
  
  // In badminton, a player needs to reach maxPoints (typically 21)
  // And have a 2-point lead if requireTwoPointLead is true
  if (requireTwoPointLead) {
    return (team1Score >= maxPoints && team1Score - team2Score >= 2) || 
           (team2Score >= maxPoints && team2Score - team1Score >= 2);
  } else {
    return team1Score >= maxPoints || team2Score >= maxPoints;
  }
};

// Check if match is complete based on badminton rules (typically best of 3 sets)
export const isMatchComplete = (
  match: Match, 
  scoringSettings: ScoringSettings
): boolean => {
  const { maxSets } = scoringSettings;
  const setsNeededToWin = Math.ceil(maxSets / 2);
  
  let team1Sets = 0;
  let team2Sets = 0;
  
  match.scores.forEach(score => {
    if (score.team1Score > score.team2Score && 
        isSetComplete(score.team1Score, score.team2Score, scoringSettings)) {
      team1Sets++;
    } else if (score.team2Score > score.team1Score && 
               isSetComplete(score.team2Score, score.team1Score, scoringSettings)) {
      team2Sets++;
    }
  });
  
  return team1Sets >= setsNeededToWin || team2Sets >= setsNeededToWin;
};

// Determine winner and loser of a match
export const determineMatchWinnerAndLoser = (
  match: Match, 
  scoringSettings: ScoringSettings = getDefaultScoringSettings()
): { winner: Team, loser: Team } | null => {
  // Cannot determine winner/loser if not enough scores
  if (!match.scores || match.scores.length === 0) return null;
  
  let team1Sets = 0;
  let team2Sets = 0;
  
  match.scores.forEach(score => {
    if (score.team1Score > score.team2Score && 
        isSetComplete(score.team1Score, score.team2Score, scoringSettings)) {
      team1Sets++;
    } else if (score.team2Score > score.team1Score && 
               isSetComplete(score.team2Score, score.team1Score, scoringSettings)) {
      team2Sets++;
    }
  });
  
  const setsNeededToWin = Math.ceil(scoringSettings.maxSets / 2);
  
  if (team1Sets >= setsNeededToWin) {
    return { winner: match.team1, loser: match.team2 };
  } else if (team2Sets >= setsNeededToWin) {
    return { winner: match.team2, loser: match.team1 };
  }
  
  return null; // No winner yet
};

// Update bracket progression
export const updateBracketProgression = (
  tournament: Tournament, 
  completedMatch: Match, 
  winner: Team
): Tournament => {
  if (!completedMatch.nextMatchId) return tournament;
  
  const updatedMatches = [...tournament.matches];
  const nextMatchIndex = updatedMatches.findIndex(m => m.id === completedMatch.nextMatchId);
  
  if (nextMatchIndex < 0) return tournament;
  
  const nextMatch = updatedMatches[nextMatchIndex];
  const isFirstTeam = completedMatch.bracketPosition && completedMatch.bracketPosition % 2 !== 0;
  
  updatedMatches[nextMatchIndex] = {
    ...nextMatch,
    team1: isFirstTeam ? winner : nextMatch.team1,
    team2: !isFirstTeam ? winner : nextMatch.team2
  };
  
  return {
    ...tournament,
    matches: updatedMatches,
    updatedAt: new Date()
  };
};
