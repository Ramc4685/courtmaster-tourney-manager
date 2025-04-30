import { z } from 'zod';
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
  playerName?: string;
  contactEmail?: string;
  teamSize?: number;
  waitlistHistory?: Array<{
    date: string;
    fromPosition: number;
    toPosition: number;
    reason?: string;
  }>;
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

// Player registration schema
export const playerRegistrationSchema = z.object({
  player_id: z.string(),
  division_id: z.string(),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().optional()
});

// Generic registration interface for mixed lists
export interface RegistrationItem {
  id: string;
  status: RegistrationStatus;
  metadata: RegistrationMetadata;
  createdAt: Date;
  updatedAt: Date;
}

// Team registration schema
export const teamRegistrationSchema = z.object({
  team_name: z.string().min(1, "Team name is required"),
  division_id: z.string(),
  captain: z.object({
    firstName: z.string().min(1, "First name is required"),
    lastName: z.string().min(1, "Last name is required"),
    email: z.string().email("Invalid email address"),
    phone: z.string().optional()
  }),
  players: z.array(z.object({
    firstName: z.string().min(1, "First name is required"),
    lastName: z.string().min(1, "Last name is required"),
    email: z.string().email("Invalid email address"),
    phone: z.string().optional()
  })).min(1, "At least one player is required")
});
