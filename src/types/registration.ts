
import { RegistrationStatus } from './tournament-enums';

export interface TournamentRegistration {
  id: string;
  status: RegistrationStatus;
  metadata: {
    checkInTime?: string;
    playerName?: string;
    teamName?: string;
    teamSize?: number;
    division?: string;
    contactEmail?: string;
    contactPhone?: string;
    emergencyContact?: string;
    [key: string]: any;
  };
  divisionId: string;
  tournamentId: string;
  playerId?: string;
  partnerId?: string;
  teamId?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  priority?: number;
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

export interface RegistrationFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  division: string;
  agreeToTerms: boolean;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
}

export interface TeamRegistrationFormData {
  teamName: string;
  division: string;
  captainName: string;
  captainEmail: string;
  captainPhone?: string;
  players: Array<{
    name: string;
    email?: string;
  }>;
  agreeToTerms: boolean;
}
