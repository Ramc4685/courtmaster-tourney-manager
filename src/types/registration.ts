
import { RegistrationStatus } from './tournament-enums';

export interface RegistrationComment {
  id: string;
  text: string;
  createdAt: string;
  createdBy: string;
}

export interface RegistrationMetadata {
  notes?: string;
  priority?: number;
  comments?: RegistrationComment[];
  waitlistPosition?: number;
  waitlistReason?: string;
  waitlistNotified?: string;
  tags?: string[];
  source?: string;
  checkInNotes?: string;
  checkInTime?: string;
}

export interface TeamMember {
  name: string;
  email: string;
  phone?: string;
  role?: string;
}

export interface PlayerRegistrationWithStatus {
  id: string;
  playerId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  division_id: string;
  tournament_id: string;
  status: RegistrationStatus;
  metadata: RegistrationMetadata;
  createdAt: Date;
  updatedAt: Date;
}

export interface TeamRegistrationWithStatus {
  id: string;
  teamId?: string;
  teamName: string;
  captainName: string;
  captainEmail: string;
  captainPhone?: string;
  division_id: string;
  tournament_id: string;
  members: TeamMember[];
  status: RegistrationStatus;
  metadata: RegistrationMetadata;
  createdAt: Date;
  updatedAt: Date;
}

// For backward compatibility
export type TournamentRegistrationStatus = RegistrationStatus;

export interface TournamentRegistration {
  id: string;
  tournament_id: string;
  player_id?: string;
  team_id?: string;
  division_id: string;
  status: RegistrationStatus;
  created_at: string;
  updated_at: string;
  metadata: RegistrationMetadata;
}
