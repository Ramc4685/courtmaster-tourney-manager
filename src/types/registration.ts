import { z } from 'zod';
import { RegistrationStatus } from './entities';

export const playerRegistrationSchema = z.object({
  player_id: z.string(),
  division_id: z.string(),
  firstName: z.string().min(2, "First name is required"),
  lastName: z.string().min(2, "Last name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().optional(),
});

export const teamRegistrationSchema = z.object({
  team_name: z.string().min(2, "Team name is required"),
  division_id: z.string(),
  captain: z.object({
    firstName: z.string().min(2, "Captain's first name is required"),
    lastName: z.string().min(2, "Captain's last name is required"),
    email: z.string().email("Invalid email address"),
    phone: z.string().optional(),
  }),
  players: z.array(
    z.object({
      firstName: z.string().min(2, "Player's first name is required"),
      lastName: z.string().min(2, "Player's last name is required"),
      email: z.string().email("Invalid email address").optional(),
      phone: z.string().optional(),
    })
  ).min(1, "At least one player is required"),
});

export interface RegistrationMetadata {
  waitlistPosition?: number;
  checkInTime?: string;
  notes?: string;
  verificationCode?: string;
}

export interface PlayerRegistrationWithStatus {
  id: string;
  playerId: string;
  divisionId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  status: RegistrationStatus;
  metadata: RegistrationMetadata;
  createdAt: Date;
  updatedAt: Date;
}

export interface TeamRegistrationWithStatus {
  id: string;
  teamId: string;
  divisionId: string;
  teamName: string;
  captainName: string;
  playerCount: number;
  status: RegistrationStatus;
  metadata: RegistrationMetadata;
  createdAt: Date;
  updatedAt: Date;
}

export interface TournamentRegistration {
  id: string;
  tournamentId: string;
  divisionId: string;
  status: RegistrationStatus;
  registeredAt: Date;
  updatedAt: Date;
  metadata: RegistrationMetadata;
}
