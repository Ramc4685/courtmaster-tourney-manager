/**
 * Match adapter utilities for converting between different match formats
 * Provides a consistent interface for match data transformations
 */

import {
  StandardMatch,
  DbMatch,
  LegacyUiMatch,
  MatchScores,
  ScoreSet,
  LegacyMatchScore,
  dbToStandardMatch,
  standardToDbMatch,
  legacyToStandardMatch,
  standardToLegacyMatch,
  normalizeMatch,
  isDbMatch,
  isLegacyUiMatch,
  isStandardMatch
} from '@/types/match';
import { MatchStatus } from '@/types/tournament-enums';

// Re-export the main conversion functions
export {
  dbToStandardMatch as fromDatabase,
  standardToDbMatch as toDatabase,
  legacyToStandardMatch as fromLegacy,
  standardToLegacyMatch as toLegacy,
  normalizeMatch,
  isDbMatch,
  isLegacyUiMatch,
  isStandardMatch
};

// Re-export types for convenience
export type {
  StandardMatch as UIMatch,
  StandardMatch,
  DbMatch,
  LegacyUiMatch,
  MatchScores,
  ScoreSet,
  LegacyMatchScore
};

/**
 * Utility functions for working with match data in components
 */

/**
 * Gets participant names from a match, handling different formats
 */
export const getParticipantNames = (match: StandardMatch): { team1: string; team2: string } => {
  const team1Name = match.team1_name ||
                   (match.team1_player1 && match.team1_player2
                     ? `${match.team1_player1} / ${match.team1_player2}`
                     : match.team1_player1) ||
                   'Team 1';

  const team2Name = match.team2_name ||
                   (match.team2_player1 && match.team2_player2
                     ? `${match.team2_player1} / ${match.team2_player2}`
                     : match.team2_player1) ||
                   'Team 2';

  return { team1: team1Name, team2: team2Name };
};

/**
 * Checks if a match has valid participant information
 */
export const hasValidParticipants = (match: StandardMatch): boolean => {
  return Boolean(
    (match.team1Id || match.team1_player1 || match.team1_name) &&
    (match.team2Id || match.team2_player1 || match.team2_name)
  );
};

/**
 * Gets the current score for display purposes
 */
export const getCurrentScore = (match: StandardMatch): { team1: number; team2: number } => {
  if (!match.scores?.sets?.length) {
    return { team1: 0, team2: 0 };
  }

  const currentSet = match.scores.sets[match.scores.current_set - 1] || match.scores.sets[0];
  return {
    team1: currentSet.team1 || 0,
    team2: currentSet.team2 || 0
  };
};

/**
 * Gets the match winner information
 */
export const getMatchWinner = (match: StandardMatch): { winnerId?: string; winnerName?: string; isComplete: boolean } => {
  const isComplete = match.status === MatchStatus.COMPLETED;

  if (!isComplete || !match.winner_id) {
    return { isComplete: false };
  }

  const winnerName = match.winner_id === match.team1Id
    ? getParticipantNames(match).team1
    : getParticipantNames(match).team2;

  return {
    winnerId: match.winner_id,
    winnerName,
    isComplete: true
  };
};

/**
 * Checks if a match is schedulable (has valid participants and scheduling info)
 */
export const isSchedulable = (match: StandardMatch): boolean => {
  return hasValidParticipants(match) && Boolean(match.scheduledTime);
};

/**
 * Checks if a match is currently in progress
 */
export const isInProgress = (match: StandardMatch): boolean => {
  return match.status === MatchStatus.IN_PROGRESS;
};

/**
 * Checks if a match is ready to start (scheduled and participants ready)
 */
export const isReadyToStart = (match: StandardMatch): boolean => {
  return match.status === MatchStatus.SCHEDULED &&
         hasValidParticipants(match) &&
         Boolean(match.scheduledTime);
};

/**
 * Creates a new empty standard match with default values
 */
export const createEmptyMatch = (overrides: Partial<StandardMatch> = {}): StandardMatch => {
  return {
    id: '',
    tournamentId: '',
    status: MatchStatus.SCHEDULED,
    bracketRound: 1,
    bracketPosition: 1,
    scores: {
      current_set: 1,
      sets: []
    },
    ...overrides
  };
};

/**
 * Safely updates match scores while maintaining data integrity
 */
export const updateMatchScores = (
  match: StandardMatch,
  newScores: Partial<MatchScores>
): StandardMatch => {
  const currentScores = match.scores || { current_set: 1, sets: [] };

  return {
    ...match,
    scores: {
      ...currentScores,
      ...newScores
    }
  };
};

/**
 * Validates match data before saving
 */
export const validateMatch = (match: StandardMatch): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (!match.tournamentId) {
    errors.push('Tournament ID is required');
  }

  if (!hasValidParticipants(match)) {
    errors.push('Both participants must be specified');
  }

  if (match.bracketRound < 1) {
    errors.push('Bracket round must be positive');
  }

  if (match.bracketPosition < 1) {
    errors.push('Bracket position must be positive');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};