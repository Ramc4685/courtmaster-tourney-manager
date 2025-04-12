
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
  matchFormat?: 'TIMED' | 'STANDARD';
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
}
