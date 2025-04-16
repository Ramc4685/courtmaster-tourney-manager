export interface Team {
  id: string;
  name: string;
  seed?: number;
  divisionId?: string;
}

export interface Match {
  id: string;
  tournamentId: string;
  round: number;
  matchNumber: number;
  team1Id: string | null;
  team2Id: string | null;
  winnerId: string | null;
  nextMatchId: string | null;
  bracket: 'WINNERS' | 'LOSERS';
  status: 'PENDING' | 'READY' | 'IN_PROGRESS' | 'COMPLETED';
  score?: {
    team1: number;
    team2: number;
  };
}

export interface Tournament {
  id: string;
  name: string;
  format: TournamentFormat;
  seedingEnabled: boolean;
  divisions?: Division[];
  startDate: Date;
  endDate: Date;
  status: TournamentStatus;
}

export interface Division {
  id: string;
  name: string;
  tournamentId: string;
  teams: Team[];
}

export enum TournamentFormat {
  SINGLE_ELIMINATION = 'SINGLE_ELIMINATION',
  DOUBLE_ELIMINATION = 'DOUBLE_ELIMINATION',
  ROUND_ROBIN = 'ROUND_ROBIN',
  GROUP_STAGE = 'GROUP_STAGE'
}

export enum TournamentStatus {
  DRAFT = 'DRAFT',
  REGISTRATION = 'REGISTRATION',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED'
} 