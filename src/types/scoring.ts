export interface ScoringRule {
  id: string;
  name: string;
  sport: string;
  maxPoints: number;
  requireTwoPointLead: boolean;
  maxTwoPointLeadScore: number;
  maxSets: number;
  setsToWin: number;
  tiebreakRules?: {
    pointsToWin: number;
    requireTwoPointLead: boolean;
    maxPoints: number;
  };
  customRules?: Record<string, any>;
}

export interface TiebreakRules {
  pointsToWin: number;
  requireTwoPointLead: boolean;
  maxPoints: number;
}

export interface ScoringSettings {
  // Basic scoring configuration
  pointsToWin: number;
  mustWinByTwo: boolean;
  maxPoints: number;
  maxSets: number;
  requireTwoPointLead: boolean;
  maxTwoPointLeadScore: number;
  
  // Optional advanced configuration
  setsToWin?: number;
  gamesPerSet?: number;
  pointsPerGame?: number;
  matchFormat?: 'TIMED' | 'STANDARD';
  
  // Tiebreak configuration
  tiebreakRules?: TiebreakRules;
  finalSetTiebreak?: boolean;
  tiebreakPoints?: number;
  
  // Additional metadata
  customRules?: Record<string, any>;
}

export interface ScoreValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface ScoreAuditLog {
  timestamp: Date;
  action: string;
  details: {
    score: string;
    scorer: string;
    setComplete: boolean;
    previousScore?: string;
    reason?: string;
  };
  user_id: string;
}

export interface MatchScore {
  team1Score: number;
  team2Score: number;
  isComplete?: boolean;
  winner?: 'team1' | 'team2' | null;
  duration?: number;
  auditLogs?: ScoreAuditLog[];
}

export interface MatchScoringState {
  scores?: MatchScore[];
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
  handleSelectMatch?: (match: any) => void;
  handleStandaloneScoreChange?: (score: any) => void;
  handleStartMatch?: () => void;
  handleStandaloneStartMatch?: () => void;
  handleStandaloneCompleteMatch?: () => void;
  handleCompleteMatch?: () => void;
  handleStandaloneNewSet?: () => void;
  handleNewSet?: () => void;
}
