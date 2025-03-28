
export type Player = {
  id: string;
  name: string;
  email?: string;
  phone?: string;
};

export type Team = {
  id: string;
  name: string;
  players: Player[];
  seed?: number; // For tournament seeding
  initialRanking?: number; // Initial ranking (#1-#38)
};

export type Division = "DIVISION_1" | "DIVISION_2" | "DIVISION_3" | "QUALIFIER_DIV1" | "QUALIFIER_DIV2" | "GROUP_DIV3" | "INITIAL";

export type TournamentStage = "INITIAL_ROUND" | "DIVISION_PLACEMENT" | "PLAYOFF_KNOCKOUT" | "COMPLETED";

export type MatchStatus = "SCHEDULED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";

export type MatchScore = {
  team1Score: number;
  team2Score: number;
};

export type Match = {
  id: string;
  tournamentId: string;
  team1: Team;
  team2: Team;
  scores: MatchScore[];
  division: Division;
  stage: TournamentStage;
  courtNumber?: number;
  scheduledTime?: Date;
  status: MatchStatus;
  winner?: Team;
  loser?: Team;
  bracketRound?: number; // The round in the bracket (1, 2, 3, etc.)
  bracketPosition?: number; // Position within the round
  nextMatchId?: string; // ID of the next match (for advancement)
  groupName?: string; // For group matches (e.g., "Group A")
};

export type CourtStatus = "AVAILABLE" | "IN_USE" | "MAINTENANCE";

export type Court = {
  id: string;
  name: string;
  number: number;
  status: CourtStatus;
  currentMatch?: Match;
};

export type TournamentFormat = "SINGLE_ELIMINATION" | "DOUBLE_ELIMINATION" | "ROUND_ROBIN" | "GROUP_DIVISION" | "MULTI_STAGE";

export type TournamentStatus = "DRAFT" | "PUBLISHED" | "IN_PROGRESS" | "COMPLETED";

// Updated scoring settings to include maxTwoPointLeadScore
export type ScoringSettings = {
  maxPoints: number;
  maxSets: number;
  requireTwoPointLead: boolean;
  maxTwoPointLeadScore?: number; // Maximum score for a win when using two-point lead rule
};

export type Tournament = {
  id: string;
  name: string;
  description?: string;
  format: TournamentFormat;
  status: TournamentStatus;
  currentStage: TournamentStage;
  teams: Team[];
  matches: Match[];
  courts: Court[];
  startDate: Date;
  endDate?: Date;
  createdAt: Date;
  updatedAt: Date;
  divisionProgression?: boolean; // Whether to use the division progression system
  autoAssignCourts?: boolean; // Whether to automatically assign available courts to scheduled matches
  scoringSettings?: ScoringSettings; // Added scoring settings
};

// Groups for Division 3 group stage
export type Group = {
  id: string;
  name: string;
  teamIds: string[];
};
