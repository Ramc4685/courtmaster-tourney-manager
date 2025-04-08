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
  isComplete: boolean;
  winner: 'team1' | 'team2' | null;
  duration: number;
  auditLogs: ScoreAuditLog[];
} 