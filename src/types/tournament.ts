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

export interface ScoringSettings {
  pointsToWin: number;
  mustWinByTwo: boolean;
  maxPoints: number;
  // Additional required properties
  maxSets: number;
  requireTwoPointLead: boolean;
  maxTwoPointLeadScore: number;
  setsToWin?: number;
  tiebreakRules?: {
    pointsToWin: number;
    requireTwoPointLead: boolean;
    maxPoints: number;
  };
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

export interface Match {
  id: string;
  tournamentId: string;
  matchNumber?: string;
  team1?: Team;
  team2?: Team;
  winner?: Team | "team1" | "team2";
  loser?: Team | "team1" | "team2";
  scores: MatchScore[];
  status: MatchStatus;
  courtNumber?: number;
  scheduledTime?: Date;
  startTime?: Date;
  endTime?: Date;
  division?: Division;
  stage?: TournamentStage;
  round?: number;
  bracketRound?: number;
  bracketPosition?: number;
  nextMatchId?: string;
  nextMatchPosition?: "team1" | "team2";
  previousMatchIds?: string[];
  updatedAt?: Date;
  updated_by?: string;
}
