
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
};

export type Court = {
  id: string;
  name: string;
  number: number;
  status: "AVAILABLE" | "IN_USE" | "MAINTENANCE";
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
};
