
import { MatchScore } from './tournament';
import { MatchScores, ScoreSet } from './entities';

export interface ScoringSettings {
  pointsToWin: number;
  mustWinByTwo: boolean;
  maxPoints: number;
  maxSets: number;
  requireTwoPointLead: boolean;
  maxTwoPointLeadScore: number;
  setsToWin?: number;
  gamesPerSet?: number;
  pointsPerGame?: number;
  matchFormat?: 'TIMED' | 'STANDARD'; // Add for compatibility with tournament.ScoringSettings
}

export interface MatchScoringState {
  scores?: MatchScore[] | MatchScores;
  matchComplete?: boolean;
  winner?: 'team1' | 'team2' | null;
  completeSet?: (setNumber: number) => void;
  resetMatch?: () => void;
}

export interface ScoringState {
  currentMatch: any;
  currentSet: number;
  isLoading: boolean;
  error: string | null;
  completeMatch: (matchId: string) => void;
  updateScore: (teamIndex: 'team1' | 'team2', increment: boolean) => void;
  startNewSet: () => void;
  setSelectedMatch: (match: any) => void;
  handleSelectMatch?: (match: any) => void; // Add missing method
  handleStandaloneScoreChange?: (score: any) => void; // Add missing method
  handleStartMatch?: () => void; // Add missing method
  handleStandaloneStartMatch?: () => void; // Add missing method
  handleStandaloneCompleteMatch?: () => void; // Add missing method
  handleCompleteMatch?: () => void; // Add missing method
  handleStandaloneNewSet?: () => void; // Add missing method
  handleNewSet?: () => void; // Add missing method
}

// Add missing types for ScoreEntry
export interface ScoreValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface ScoreAuditLog {
  action: string;
  timestamp: string;
  scorer: string;
  details: any;
}
