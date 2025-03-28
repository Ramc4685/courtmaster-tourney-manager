
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
};

export type Division = "GROUP" | "DIV1" | "DIV2" | "DIV3";

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
  courtNumber?: number;
  scheduledTime?: Date;
  status: MatchStatus;
  winner?: Team;
  bracketRound?: number; // The round in the bracket (1, 2, 3, etc.)
  bracketPosition?: number; // Position within the round
  nextMatchId?: string; // ID of the next match (for advancement)
};

export type CourtStatus = "AVAILABLE" | "IN_USE" | "MAINTENANCE";

export type Court = {
  id: string;
  name: string;
  number: number;
  status: CourtStatus;
  currentMatch?: Match;
};

export type TournamentFormat = "SINGLE_ELIMINATION" | "DOUBLE_ELIMINATION" | "ROUND_ROBIN" | "GROUP_DIVISION";

export type TournamentStatus = "DRAFT" | "PUBLISHED" | "IN_PROGRESS" | "COMPLETED";

export type Tournament = {
  id: string;
  name: string;
  description?: string;
  format: TournamentFormat;
  status: TournamentStatus;
  teams: Team[];
  matches: Match[];
  courts: Court[];
  startDate: Date;
  endDate?: Date;
  createdAt: Date;
  updatedAt: Date;
  divisionProgression?: boolean; // Whether to use the division progression system
  autoAssignCourts?: boolean; // Whether to automatically assign available courts to scheduled matches
};
