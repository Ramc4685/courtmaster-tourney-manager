import { Match, Tournament, MatchStatus, StandaloneMatch } from "@/types/tournament";
import { addMatchAuditLog, addScoringAuditInfo } from "@/utils/matchAuditUtils";
import { getCurrentUserId } from "@/utils/auditUtils";

// Guard type to check if it's a tournament match
function isTournamentMatch(match: Match | StandaloneMatch): match is Match {
  return 'tournamentId' in match && 'division' in match && 'stage' in match;
}

// Safe cast function for Match type
function ensureTournamentMatch(match: Match | StandaloneMatch): Match {
  if (isTournamentMatch(match)) {
    return match;
  }
  // This is a fallback that should never happen in practice
  return {
    ...match,
    tournamentId: 'fallback',
    division: 'INITIAL',
    stage: 'INITIAL_ROUND',
  } as Match;
}

// Updates the match status in a tournament
export const updateMatchStatusInTournament = (
  matchId: string,
  status: MatchStatus,
  tournament: Tournament
): Tournament => {
  const updatedMatches = tournament.matches.map((match) => {
    if (match.id === matchId) {
      const userId = getCurrentUserId();
      const now = new Date();

      // Create audit log entry
      const updatedMatch = addMatchAuditLog(
        {
          ...match,
          status,
          updatedAt: now,
          updated_by: userId,
        },
        `Match status updated to ${status}`
      );

      return ensureTournamentMatch(updatedMatch); // Use safe cast
    }
    return match;
  });

  return {
    ...tournament,
    matches: updatedMatches,
    updatedAt: new Date(),
    updated_by: getCurrentUserId(),
  };
};

// Updates the match score in a tournament
export const updateMatchScoreInTournament = (
  matchId: string,
  setIndex: number,
  team1Score: number,
  team2Score: number,
  tournament: Tournament,
  scorerName?: string
): Tournament => {
  const updatedMatches = tournament.matches.map((match) => {
    if (match.id === matchId) {
      // Get existing scores or initialize empty array
      const scores = [...(match.scores || [])];

      // Ensure we have enough entries in the scores array
      while (scores.length <= setIndex) {
        scores.push({ team1Score: 0, team2Score: 0 });
      }

      // Update the score for the specific set
      scores[setIndex] = { team1Score, team2Score };

      // Create audit information for scoring
      const updatedMatch = {
        ...match,
        scores,
        updatedAt: new Date(),
      };

      // Use safe cast for tournament match
      return ensureTournamentMatch(addScoringAuditInfo(updatedMatch, scorerName));
    }
    return match;
  });

  return {
    ...tournament,
    matches: updatedMatches,
    updatedAt: new Date(),
    updated_by: getCurrentUserId(),
  };
};

// Completes a match in a tournament
export const completeMatchInTournament = (
  matchId: string,
  tournament: Tournament,
  scorerName?: string
): Tournament => {
  const updatedMatches = tournament.matches.map((match) => {
    if (match.id === matchId) {
      // Update match status and set end time
      const updatedMatch = {
        ...match,
        status: "COMPLETED" as MatchStatus,
        endTime: new Date(),
        updatedAt: new Date(),
        updated_by: getCurrentUserId(),
      };

      // Use safe cast for tournament match
      return ensureTournamentMatch(addScoringAuditInfo(updatedMatch, scorerName));
    }
    return match;
  });

  return {
    ...tournament,
    matches: updatedMatches,
    updatedAt: new Date(),
    updated_by: getCurrentUserId(),
  };
};

// Determines match winner based on scores
export const determineMatchWinner = (match: Match): "team1" | "team2" | "draw" | undefined => {
  if (!match.scores || match.scores.length === 0) {
    return undefined;
  }

  // Count sets won by each team
  let team1SetsWon = 0;
  let team2SetsWon = 0;

  for (const score of match.scores) {
    if (score.team1Score > score.team2Score) {
      team1SetsWon++;
    } else if (score.team2Score > score.team1Score) {
      team2SetsWon++;
    }
  }

  if (team1SetsWon > team2SetsWon) {
    return "team1";
  } else if (team2SetsWon > team1SetsWon) {
    return "team2";
  } else {
    return "draw";
  }
};
