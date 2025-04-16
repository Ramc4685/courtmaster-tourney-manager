import { BaseEntity } from './base.model';

export enum TournamentStatus {
  DRAFT = 'DRAFT',
  REGISTRATION = 'REGISTRATION',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED'
}

export enum TournamentFormat {
  SINGLE_ELIMINATION = 'SINGLE_ELIMINATION',
  DOUBLE_ELIMINATION = 'DOUBLE_ELIMINATION',
  ROUND_ROBIN = 'ROUND_ROBIN',
  GROUP_STAGE = 'GROUP_STAGE'
}

export interface Tournament extends BaseEntity {
  name: string;
  description?: string;
  startDate: Date;
  endDate: Date;
  status: TournamentStatus;
  format: TournamentFormat;
  organizer_id: string;
  divisions: Division[];
  teams: Team[];
  matches: Match[];
  seedingEnabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Division extends BaseEntity {
  name: string;
  description?: string;
  tournamentId: string;
  teams: Team[];
  matches: Match[];
}

export interface Team extends BaseEntity {
  name: string;
  tournamentId: string;
  divisionId?: string;
  players: string[]; // Player IDs
  rank?: number;
  points?: number;
  seed?: number;
}

export enum MatchStatus {
  SCHEDULED = 'SCHEDULED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED'
}

export interface Match extends BaseEntity {
  tournamentId: string;
  divisionId?: string;
  stage: string;
  round: number;
  matchNumber: number;
  status: MatchStatus;
  team1Id: string;
  team2Id: string;
  winnerId?: string;
  loserId?: string;
  score?: {
    team1: number;
    team2: number;
  };
  startTime?: Date;
  endTime?: Date;
  courtId?: string;
  nextMatchId?: string; // For bracket progression
  previousMatchIds?: string[]; // Matches that led to this match
}

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class TournamentModel implements Tournament {
  id: string;
  name: string;
  description?: string;
  startDate: Date;
  endDate: Date;
  status: TournamentStatus;
  format: TournamentFormat;
  organizer_id: string;
  divisions: Division[];
  teams: Team[];
  matches: Match[];
  seedingEnabled: boolean;
  createdAt: Date;
  updatedAt: Date;

  constructor(tournament: Tournament) {
    this.id = tournament.id;
    this.name = tournament.name;
    this.description = tournament.description;
    this.startDate = tournament.startDate;
    this.endDate = tournament.endDate;
    this.status = tournament.status;
    this.format = tournament.format;
    this.organizer_id = tournament.organizer_id;
    this.divisions = tournament.divisions;
    this.teams = tournament.teams;
    this.matches = tournament.matches;
    this.seedingEnabled = tournament.seedingEnabled;
    this.createdAt = tournament.createdAt;
    this.updatedAt = tournament.updatedAt;
  }

  validateTeams(teams: Team[]): void {
    if (teams.length < 2) {
      throw new ValidationError('Tournament requires at least 2 teams');
    }

    if (this.seedingEnabled) {
      this.validateSeeding(teams);
    }
  }

  private validateSeeding(teams: Team[]): void {
    const seededTeams = teams.filter(team => team.seed !== undefined);
    if (seededTeams.length !== teams.length) {
      throw new ValidationError('All teams must have seeds when seeding is enabled');
    }

    const seeds = seededTeams.map(team => team.seed!);
    const uniqueSeeds = new Set(seeds);
    if (uniqueSeeds.size !== teams.length) {
      throw new ValidationError('Each team must have a unique seed');
    }

    const validSeeds = Array.from(uniqueSeeds).every(seed => seed > 0 && seed <= teams.length);
    if (!validSeeds) {
      throw new ValidationError('Seeds must be consecutive numbers starting from 1');
    }
  }

  validateMatch(match: Match): void {
    if (!match.team1Id || !match.team2Id) {
      throw new ValidationError('Match must have both teams assigned');
    }

    if (match.team1Id === match.team2Id) {
      throw new ValidationError('Teams in a match must be different');
    }

    if (match.status === 'COMPLETED' && !match.winnerId) {
      throw new ValidationError('Completed match must have a winner');
    }
  }
} 