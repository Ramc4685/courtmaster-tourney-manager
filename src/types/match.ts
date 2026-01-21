/**
 * Standardized Match types for the CourtMaster application
 * This file provides a canonical Match interface and adapters to handle
 * different shapes across the application (UI vs DB layer)
 */

import { MatchStatus, Division, TournamentStageEnum } from './tournament-enums';

// Canonical scoring types
export interface ScoreSet {
  team1: number;
  team2: number;
  completed: boolean;
  winner?: 1 | 2;
}

export interface MatchScores {
  current_set: number;
  sets: ScoreSet[];
}

// Legacy scoring format for compatibility
export interface LegacyMatchScore {
  team1Score: number;
  team2Score: number;
}

// Canonical Match interface - this should be used throughout the application
export interface StandardMatch {
  // Core identifiers
  id: string;
  tournamentId: string;
  matchNumber?: string;

  // Tournament structure
  divisionId?: string;
  division?: string | Division;
  stage?: TournamentStageEnum;
  bracketRound: number;
  bracketPosition: number;
  groupName?: string;

  // Participants
  team1Id?: string;
  team2Id?: string;
  team1_player1?: string;
  team2_player1?: string;
  team1_player2?: string;
  team2_player2?: string;
  team1_name?: string;
  team2_name?: string;

  // Match state
  status: MatchStatus;
  scores?: MatchScores;
  winner?: string | number;
  loser?: string | number;
  winner_id?: string | null;
  loser_id?: string | null;
  servingTeam?: 1 | 2;

  // Scheduling
  scheduledTime?: Date | string;
  startTime?: Date | string;
  endTime?: Date | string;
  courtId?: string;
  courtNumber?: number;
  court?: {
    id: string;
    name: string;
    number: number;
  };

  // Match progression
  progression?: string | {
    winnerGoesTo?: string;
    loserGoesTo?: string;
  };

  // Metadata
  scorerName?: string;
  verified?: boolean;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

// Database layer match (with snake_case fields)
export interface DbMatch {
  id: string;
  tournament_id: string;
  division_id?: string;
  team1_id?: string;
  team2_id?: string;
  team1_player1?: string;
  team2_player1?: string;
  team1_player2?: string;
  team2_player2?: string;
  status: MatchStatus;
  scheduled_time?: string;
  start_time?: string;
  end_time?: string;
  court_id?: string;
  court_number?: number;
  bracket_round: number;
  bracket_position: number;
  match_number?: string;
  scores?: string; // JSON stringified
  winner_id?: string | null;
  loser_id?: string | null;
  progression?: string; // JSON stringified
  scorer_name?: string;
  verified?: boolean;
  created_at: string;
  updated_at: string;
}

// Legacy UI match format (for backward compatibility)
export interface LegacyUiMatch {
  id: string;
  tournamentId: string;
  division: Division;
  stage: TournamentStageEnum;
  bracketRound: number;
  bracketPosition: number;
  progression: {
    winnerGoesTo?: string;
    loserGoesTo?: string;
  };
  team1: { id: string; name: string; };
  team2: { id: string; name: string; };
  team1Id?: string;
  team2Id?: string;
  scores: LegacyMatchScore[];
  status: MatchStatus;
  scheduledTime: Date;
  startTime?: Date;
  endTime?: Date;
  courtId?: string;
  courtNumber?: number;
  winner?: number;
  groupName?: string;
  matchNumber?: string;
  scorerName?: string;
}

/**
 * Adapter functions to convert between different match formats
 */

// Convert database match to standard format
export const dbToStandardMatch = (dbMatch: DbMatch): StandardMatch => {
  const scores = dbMatch.scores ? JSON.parse(dbMatch.scores) : undefined;
  const progression = dbMatch.progression ? JSON.parse(dbMatch.progression) : undefined;

  return {
    id: dbMatch.id,
    tournamentId: dbMatch.tournament_id,
    divisionId: dbMatch.division_id,
    team1Id: dbMatch.team1_id,
    team2Id: dbMatch.team2_id,
    team1_player1: dbMatch.team1_player1,
    team2_player1: dbMatch.team2_player1,
    team1_player2: dbMatch.team1_player2,
    team2_player2: dbMatch.team2_player2,
    status: dbMatch.status,
    scheduledTime: dbMatch.scheduled_time ? new Date(dbMatch.scheduled_time) : undefined,
    startTime: dbMatch.start_time ? new Date(dbMatch.start_time) : undefined,
    endTime: dbMatch.end_time ? new Date(dbMatch.end_time) : undefined,
    courtId: dbMatch.court_id,
    courtNumber: dbMatch.court_number,
    bracketRound: dbMatch.bracket_round,
    bracketPosition: dbMatch.bracket_position,
    matchNumber: dbMatch.match_number,
    scores,
    winner_id: dbMatch.winner_id,
    loser_id: dbMatch.loser_id,
    progression,
    scorerName: dbMatch.scorer_name,
    verified: dbMatch.verified,
    createdAt: new Date(dbMatch.created_at),
    updatedAt: new Date(dbMatch.updated_at),
  };
};

// Convert standard match to database format
export const standardToDbMatch = (match: StandardMatch): Partial<DbMatch> => {
  const scores = match.scores ? JSON.stringify(match.scores) : undefined;
  const progression = match.progression ? JSON.stringify(match.progression) : undefined;

  return {
    id: match.id,
    tournament_id: match.tournamentId,
    division_id: match.divisionId,
    team1_id: match.team1Id,
    team2_id: match.team2Id,
    team1_player1: match.team1_player1,
    team2_player1: match.team2_player1,
    team1_player2: match.team1_player2,
    team2_player2: match.team2_player2,
    status: match.status,
    scheduled_time: match.scheduledTime ? new Date(match.scheduledTime).toISOString() : undefined,
    start_time: match.startTime ? new Date(match.startTime).toISOString() : undefined,
    end_time: match.endTime ? new Date(match.endTime).toISOString() : undefined,
    court_id: match.courtId,
    court_number: match.courtNumber,
    bracket_round: match.bracketRound,
    bracket_position: match.bracketPosition,
    match_number: match.matchNumber,
    scores,
    winner_id: match.winner_id,
    loser_id: match.loser_id,
    progression,
    scorer_name: match.scorerName,
    verified: match.verified,
  };
};

// Convert legacy UI match to standard format
export const legacyToStandardMatch = (legacyMatch: LegacyUiMatch): StandardMatch => {
  // Convert legacy scores to new format
  const scores: MatchScores | undefined = legacyMatch.scores.length > 0 ? {
    current_set: 1,
    sets: legacyMatch.scores.map((score, index) => ({
      team1: score.team1Score,
      team2: score.team2Score,
      completed: true, // Assume completed if in legacy format
    }))
  } : undefined;

  return {
    id: legacyMatch.id,
    tournamentId: legacyMatch.tournamentId,
    division: legacyMatch.division,
    stage: legacyMatch.stage,
    bracketRound: legacyMatch.bracketRound,
    bracketPosition: legacyMatch.bracketPosition,
    progression: legacyMatch.progression,
    team1Id: legacyMatch.team1Id || legacyMatch.team1.id,
    team2Id: legacyMatch.team2Id || legacyMatch.team2.id,
    team1_name: legacyMatch.team1.name,
    team2_name: legacyMatch.team2.name,
    scores,
    status: legacyMatch.status,
    scheduledTime: legacyMatch.scheduledTime,
    startTime: legacyMatch.startTime,
    endTime: legacyMatch.endTime,
    courtId: legacyMatch.courtId,
    courtNumber: legacyMatch.courtNumber,
    winner: legacyMatch.winner,
    groupName: legacyMatch.groupName,
    matchNumber: legacyMatch.matchNumber,
    scorerName: legacyMatch.scorerName,
  };
};

// Convert standard match to legacy UI format
export const standardToLegacyMatch = (match: StandardMatch): LegacyUiMatch => {
  // Convert new scores to legacy format
  const legacyScores: LegacyMatchScore[] = match.scores?.sets.map(set => ({
    team1Score: set.team1,
    team2Score: set.team2,
  })) || [];

  return {
    id: match.id,
    tournamentId: match.tournamentId,
    division: match.division as Division || Division.OPEN,
    stage: match.stage || TournamentStageEnum.GROUP_STAGE,
    bracketRound: match.bracketRound,
    bracketPosition: match.bracketPosition,
    progression: typeof match.progression === 'object'
      ? match.progression
      : { winnerGoesTo: undefined, loserGoesTo: undefined },
    team1: { id: match.team1Id || '', name: match.team1_name || 'Team 1' },
    team2: { id: match.team2Id || '', name: match.team2_name || 'Team 2' },
    team1Id: match.team1Id,
    team2Id: match.team2Id,
    scores: legacyScores,
    status: match.status,
    scheduledTime: new Date(match.scheduledTime || new Date()),
    startTime: match.startTime ? new Date(match.startTime) : undefined,
    endTime: match.endTime ? new Date(match.endTime) : undefined,
    courtId: match.courtId,
    courtNumber: match.courtNumber,
    winner: typeof match.winner === 'number' ? match.winner : undefined,
    groupName: match.groupName,
    matchNumber: match.matchNumber,
    scorerName: match.scorerName,
  };
};

/**
 * Type guards to determine match format
 */
export const isDbMatch = (match: any): match is DbMatch => {
  return match && typeof match === 'object' && 'tournament_id' in match;
};

export const isLegacyUiMatch = (match: any): match is LegacyUiMatch => {
  return match && typeof match === 'object' &&
         'team1' in match &&
         typeof match.team1 === 'object' &&
         'name' in match.team1;
};

export const isStandardMatch = (match: any): match is StandardMatch => {
  return match && typeof match === 'object' &&
         'tournamentId' in match &&
         !isDbMatch(match) &&
         !isLegacyUiMatch(match);
};

/**
 * Utility function to normalize any match format to standard
 */
export const normalizeMatch = (match: any): StandardMatch => {
  if (isDbMatch(match)) {
    return dbToStandardMatch(match);
  } else if (isLegacyUiMatch(match)) {
    return legacyToStandardMatch(match);
  } else if (isStandardMatch(match)) {
    return match;
  } else {
    throw new Error('Unknown match format');
  }
};

// Re-export types for convenience
export type Match = StandardMatch;
export { StandardMatch as CanonicalMatch };

// Legacy exports for backward compatibility
export type { LegacyUiMatch as TournamentMatch };
export type { DbMatch as DatabaseMatch };