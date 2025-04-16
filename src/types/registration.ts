
import { RegistrationStatus } from './tournament-enums';

export interface TournamentRegistration {
  id: string;
  status: RegistrationStatus;
  metadata: {
    playerName?: string;
    teamName?: string;
    captainName?: string;
    checkInTime?: string;
    contactEmail?: string;
    waitlistPosition?: number;
    waitlistHistory?: {
      timestamp: string;
      reason: string;
      fromPosition: number;
      toPosition: number;
    }[];
    [key: string]: any;
  };
  divisionId: string;
  tournamentId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface PlayerRegistrationWithStatus {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  status: RegistrationStatus;
  divisionId: string;
  createdAt: Date;
  metadata: Record<string, any>;
}

export interface TeamRegistrationWithStatus {
  id: string;
  teamName: string;
  captainName: string;
  playerCount: number;
  status: RegistrationStatus;
  divisionId: string;
  createdAt: Date;
  metadata: Record<string, any>;
}

export interface RegistrationRecord {
  id: string;
  tournament_id: string;
  division_id: string;
  player_id: string | null;
  team_id: string | null;
  status: RegistrationStatus;
  metadata: any;
  priority: number;
  created_at: string;
  updated_at: string;
}
