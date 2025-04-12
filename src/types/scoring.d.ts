
export interface ScoringSettings {
  pointsToWin: number;
  mustWinByTwo: boolean;
  maxPoints: number;
  maxSets: number;
  requireTwoPointLead?: boolean;
  maxTwoPointLeadScore?: number;
  setsToWin?: number;
  matchFormat?: 'TIMED' | 'STANDARD';
  gamesPerSet?: number;
  pointsPerGame?: number;
}

export interface MatchScore {
  team1Score: number;
  team2Score: number;
  setNumber?: number;
  isComplete?: boolean;
  winner?: 'team1' | 'team2' | null;
  duration?: number;
  auditLogs?: ScoreAuditLog[];
  timestamp?: string;
}

export interface ScoreAuditLog {
  action: string;
  timestamp: string;
  userId: string;
  scoreData: MatchScore;
  previousScore?: string;
}

export interface ScoreValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface MatchScoringState {
  scores: MatchScore[];
  currentSet: number;
  matchComplete: boolean;
  winner: 'team1' | 'team2' | null;
  completeSet: (setNumber: number, winner: 'team1' | 'team2') => void;
  resetMatch: () => void;
}

export interface ScoringState {
  selectMatch: (matchId: string) => void;
  selectCourt: (courtId: string) => void;
  scoreChange: (team: 'team1' | 'team2', increment: boolean) => void;
  startMatch: () => void;
  standaloneStartMatch: () => void;
  completeMatch: () => void;
  standaloneCompleteMatch: () => void;
  newSet: () => void;
  standaloneNewSet: () => void;
  standaloneScoreChange: (team: 'team1' | 'team2', increment: boolean) => void;
  handleSelectMatch: (matchId: string) => void;
  handleSelectCourt: (courtId: string) => void;
  handleScoreChange: (team: 'team1' | 'team2', increment: boolean) => void;
  handleStartMatch: () => void;
  handleStandaloneStartMatch: () => void;
  handleCompleteMatch: () => void;
  handleStandaloneCompleteMatch: () => void;
  handleNewSet: () => void;
  handleStandaloneNewSet: () => void;
  handleStandaloneScoreChange: (team: 'team1' | 'team2', increment: boolean) => void;
  handleUpdateScoringSettings: (settings: ScoringSettings) => void;
  handleBackToCourts: () => void;
}
